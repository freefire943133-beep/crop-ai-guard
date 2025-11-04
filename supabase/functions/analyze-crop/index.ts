// Edge function for crop disease analysis using Google Cloud Vision API

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    
    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    // Validate URL to prevent SSRF attacks
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    if (!SUPABASE_URL) {
      throw new Error('SUPABASE_URL is not configured');
    }

    try {
      const parsedUrl = new URL(imageUrl);
      const expectedDomain = new URL(SUPABASE_URL).hostname;
      
      // Only allow HTTPS URLs from Supabase storage
      if (parsedUrl.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed');
      }
      
      if (!parsedUrl.hostname.includes(expectedDomain)) {
        throw new Error('Only Supabase storage URLs are allowed');
      }
      
      if (!parsedUrl.pathname.includes('/storage/v1/object/')) {
        throw new Error('Invalid storage URL format');
      }
    } catch (urlError) {
      console.error('URL validation failed:', urlError);
      throw new Error('Invalid image URL provided');
    }

    const GOOGLE_CLOUD_API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!GOOGLE_CLOUD_API_KEY) {
      throw new Error('GOOGLE_CLOUD_API_KEY is not configured');
    }

    console.log('Analyzing crop image from validated storage URL');

    // Fetch the image with timeout to prevent DoS
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
    let base64Image: string;
    try {
      const imageResponse = await fetch(imageUrl, { signal: controller.signal });
      
      if (!imageResponse.ok) {
        throw new Error('Failed to fetch image');
      }
      
      // Check content type (some signed URLs return application/octet-stream)
      const contentType = imageResponse.headers.get('content-type')?.toLowerCase() || '';
      console.log('Fetched image content-type:', contentType);
      if (!(contentType.startsWith('image/') || contentType === 'application/octet-stream')) {
        throw new Error('URL must point to an image (image/* or octet-stream)');
      }
      
      // Check size (limit to 10MB)
      const contentLength = imageResponse.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        throw new Error('Image size exceeds 10MB limit');
      }
      
      const imageBuffer = await imageResponse.arrayBuffer();
      
      // Double-check actual size
      if (imageBuffer.byteLength > 10 * 1024 * 1024) {
        throw new Error('Image size exceeds 10MB limit');
      }
      
      base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));
      clearTimeout(timeoutId);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('Image fetch failed:', fetchError);
      throw new Error('Failed to fetch image from storage');
    }

    // Call Google Cloud Vision API for image analysis
    const visionResponse = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_CLOUD_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              image: {
                content: base64Image,
              },
              features: [
                { type: 'LABEL_DETECTION', maxResults: 10 },
                { type: 'IMAGE_PROPERTIES', maxResults: 5 },
                { type: 'WEB_DETECTION', maxResults: 5 },
              ],
            },
          ],
        }),
      }
    );

    if (!visionResponse.ok) {
      const errText = await visionResponse.text();
      console.error('Google Cloud Vision error:', visionResponse.status, errText);
      // Fallback to Lovable AI gateway if Vision fails
      try {
        const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
        if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY missing for fallback');

        const aiResp = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOVABLE_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.5-flash',
            messages: [
              { role: 'system', content: 'You are an expert agronomy assistant. Return STRICT JSON only (no code fences, no prose). Keys: cropType (Title Case), disease (string or "None"), severity (low|medium|high or null), confidence (0-100 integer), treatment (string, multi-line allowed). If unsure, set disease="None", severity=null, confidence=75.' },
              { role: 'user', content: `Analyze this crop image and output only JSON. Image URL: ${imageUrl}` }
            ],
          }),
        });

        if (!aiResp.ok) {
          console.error('Lovable AI gateway fallback error:', aiResp.status, await aiResp.text());
          throw new Error('AI fallback failed');
        }

        const aiData = await aiResp.json();
        const raw = aiData.choices?.[0]?.message?.content || '';

        // Robust JSON extraction: strip code fences and pick first JSON object
        const cleaned = raw
          .replace(/```json/gi, '')
          .replace(/```/g, '')
          .trim();
        let text = cleaned;
        if (!(text.trim().startsWith('{') && text.trim().endsWith('}'))) {
          const first = text.indexOf('{');
          const last = text.lastIndexOf('}');
          if (first !== -1 && last !== -1 && last > first) {
            text = text.slice(first, last + 1);
          }
        }

        let parsed: any;
        try {
          parsed = JSON.parse(text);
        } catch (e) {
          console.error('Failed to parse AI JSON after cleaning:', raw);
          throw e;
        }

        // Normalize fields
        const treatmentVal = Array.isArray(parsed.treatment)
          ? parsed.treatment.join('\n')
          : (parsed.treatment || 'Crop appears healthy. Continue regular monitoring and maintenance.');

        const analysisResult = {
          cropType: parsed.cropType || 'Unknown',
          disease: parsed.disease ?? 'None',
          severity: parsed.severity ?? null,
          confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 75,
          treatment: treatmentVal
        };

        console.log('Fallback AI analysis result:', analysisResult);
        return new Response(
          JSON.stringify(analysisResult),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200
          }
        );
      } catch (fallbackErr) {
        console.error('Fallback AI analysis failed:', fallbackErr);
        throw new Error('Image analysis failed');
      }
    }

    const visionData = await visionResponse.json();
    console.log('Vision API analysis completed successfully');

    const labels = visionData.responses?.[0]?.labelAnnotations || [];
    const webDetection = visionData.responses?.[0]?.webDetection || {};
    
    // Analyze labels to determine crop type and disease
    const cropTypes = ['corn', 'wheat', 'rice', 'tomato', 'potato', 'soybean', 'cotton'];
    const diseaseKeywords = ['blight', 'rust', 'mildew', 'rot', 'wilt', 'spot', 'mosaic', 'fungus'];
    
    let cropType = 'Unknown';
    let disease = 'None';
    let severity = null;
    let confidence = 0;
    
    // Identify crop type from labels
    for (const label of labels) {
      const desc = label.description.toLowerCase();
      for (const crop of cropTypes) {
        if (desc.includes(crop)) {
          cropType = crop.charAt(0).toUpperCase() + crop.slice(1);
          confidence = Math.round(label.score * 100);
          break;
        }
      }
    }
    
    // Check for disease indicators
    const diseaseLabels = labels.filter((label: any) => 
      diseaseKeywords.some((keyword: string) => label.description.toLowerCase().includes(keyword))
    );
    
    if (diseaseLabels.length > 0) {
      disease = diseaseLabels[0].description;
      confidence = Math.round(diseaseLabels[0].score * 100);
      
      // Determine severity based on confidence
      if (confidence > 80) {
        severity = 'high';
      } else if (confidence > 50) {
        severity = 'medium';
      } else {
        severity = 'low';
      }
    }
    
    // Generate treatment recommendations
    let treatment = 'No treatment needed';
    if (disease !== 'None') {
      treatment = `Disease detected: ${disease}. Recommended actions:
1. Remove and destroy infected plant material
2. Apply appropriate fungicide or pesticide treatment
3. Improve air circulation around plants
4. Avoid overhead watering
5. Monitor surrounding plants for spread
6. Consult with local agricultural extension office for specific treatment protocols`;
    } else {
      treatment = 'Crop appears healthy. Continue regular monitoring and maintenance.';
    }
    
    const analysisResult = {
      cropType,
      disease,
      severity,
      confidence: confidence || 75,
      treatment
    };

    console.log('Analysis result:', analysisResult);

    return new Response(
      JSON.stringify(analysisResult),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in analyze-crop function:', error instanceof Error ? error.message : 'Unknown error');
    
    // Return generic error to client, keep details server-side
    return new Response(
      JSON.stringify({ 
        error: 'Analysis failed. Please try again with a valid crop image.'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
