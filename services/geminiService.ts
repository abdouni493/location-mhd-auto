
import { GoogleGenAI } from "@google/genai";

export async function getRentalAIAnalysis(
  category: string,
  dataContext: any,
  language: 'fr' | 'ar'
) {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const contextString = JSON.stringify(dataContext);
    
    const systemInstruction = language === 'fr' 
      ? "Tu es un consultant expert en stratégie pour agences de location de voitures. Analyse les données fournies et donne des conseils professionnels, concrets et stratégiques."
      : "أنت مستشار خبير في استراتيجية وكالات تأجير السيارات. قم بتحليل البيانات المقدمة وتقديم نصائح مهنية وملموسة واستراتيجية.";

    const prompt = language === 'fr'
      ? `Analyse les données suivantes pour la catégorie [${category}] : ${contextString}. 
         Structure ta réponse avec : 
         1. Diagnostic de situation (Points forts/faibles)
         2. Analyse des tendances
         3. Recommandations stratégiques précises pour augmenter le profit et l'efficacité.`
      : `قم بتحليل البيانات التالية للفئة [${category}]: ${contextString}.
         قم بتنظيم إجابتك كالتالي:
         1. تشخيص الوضع (نقاط القوة / الضعف)
         2. تحليل الاتجاهات
         3. توصيات استراتيجية دقيقة لزيادة الربح والكفاءة.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.4, // Lower temperature for more analytical/precise output
      }
    });

    return response.text;
  } catch (error) {
    console.error("AI Analysis failed:", error);
    return language === 'fr' ? "Erreur lors de l'analyse stratégique." : "خطأ أثناء التحليل الاستراتيجي.";
  }
}
