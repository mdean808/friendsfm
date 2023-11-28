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
  const prompt = `Please identify the genre of the song '${name}' by '${artist}' from the following list of genres: Pop, Rock, Hip Hop, Rap, Pop, Blues, Folk, Classical, Heavy Metal, Country, R&B, Punk Rock, Electronic, Soul, Reggae, Funk, Techno, Disco, Alternative Rock, Ambient, Swing, Industrial, Gospel, Trance, Instrumental, Dubstep, EDM, Ska, Electronic, Pop Rock, Indie Rock, Psychedelic, New Wave, Grunge, Drum & Bass, House, K-Pop, New Age, Lo-Fi, Drill, Trap, Indie`;
  const systemPrompt =
    'You are a language model trained to provide information. Please identify the genre of a song when given the song name and artist. Users will provide song details and a list of genres for you to choose from. Ensure the response includes the correct genre. Your response should just be the name of the genre. If the song is not found or the genre is not in the list, please return choose the next closest genre from the list';
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
