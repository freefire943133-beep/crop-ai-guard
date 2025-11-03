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

    const GOOGLE_CLOUD_API_KEY = Deno.env.get('GOOGLE_CLOUD_API_KEY');
    if (!GOOGLE_CLOUD_API_KEY) {
      throw new Error('GOOGLE_CLOUD_API_KEY is not configured');
    }

    console.log('Analyzing crop image with Google Cloud Vision:', imageUrl);

    // Fetch the image and convert to base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = btoa(String.fromCharCode(...new Uint8Array(imageBuffer)));

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
      const errorText = await visionResponse.text();
      console.error('Google Cloud Vision error:', visionResponse.status, errorText);
      throw new Error(`Google Cloud Vision error: ${visionResponse.status}`);
    }

    const visionData = await visionResponse.json();
    console.log('Vision API response:', JSON.stringify(visionData, null, 2));

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
    console.error('Error in analyze-crop function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        details: 'Failed to analyze crop image'
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
