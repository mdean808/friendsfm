import { Configuration, CreateChatCompletionResponse, OpenAIApi } from 'openai';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ActualCreateChatCompletionResponse
  extends CreateChatCompletionResponse {
  error?: {
    message: string;
  };
}

export const getTrackGenre = async (name: string, artist: string) => {
  const openai = new OpenAIApi(configuration);
  const prompt = `What genre is "${name}" by "${artist}"? Pick from these comma separated options: Pop, Rock, Hip Hop / Rap, Pop, Blues, Folk, Classical, Heavy Metal, Country, R&B, Punk Rock, Electronic, Soul, Reggae, Funk, Techno, Disco, Alternative Rock, Ambient, Swing, Industrial, Gospel, Trance, Instrumental, Dubstep, EDM, Ska, Electronic, Pop Rock, Indie Rock, Psychedelic, New Wave, Grunge, Drum & Bass, House, K-Pop, New Age, Lo-Fi, Drill, Trap, Indie`;
  const systemPrompt =
    'You are an assistant that knows a lot about music. You also only respond in 1 to 3 word answers. ';
  const res = await openai.createChatCompletion({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
  });
  const data = res.data as ActualCreateChatCompletionResponse;
  if (data.error) {
    console.log('openai gpt-3.5-turbo error: ' + data.error.message);
    throw Error('AI Error');
  } else {
    return data?.choices[0].message?.content;
  }
};
