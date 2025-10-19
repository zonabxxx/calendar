import OpenAI from 'openai';
import fetch from 'node-fetch';
import readline from 'readline';
import dotenv from 'dotenv';

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SCRIPT_URL;

// Funkcie pre kalendár
async function listCalendarEvents() {
  const url = new URL(GOOGLE_SCRIPT_URL);
  url.searchParams.append('action', 'getEvents');
  url.searchParams.append('maxResults', '10');
  
  const response = await fetch(url.toString());
  return await response.json();
}

async function addCalendarEvent(summary, description, startTime, endTime, location) {
  const body = {
    summary,
    description: description || '',
    location: location || '',
    start: { dateTime: startTime },
    end: { dateTime: endTime }
  };
  
  const response = await fetch(GOOGLE_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  return await response.json();
}

// Nástroje pre ChatGPT
const tools = [
  {
    type: 'function',
    function: {
      name: 'list_events',
      description: 'Zobrazí zoznam udalostí z Google Kalendára',
      parameters: {
        type: 'object',
        properties: {
          maxResults: {
            type: 'number',
            description: 'Maximálny počet udalostí (default 10)'
          }
        }
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'add_event',
      description: 'Pridá novú udalosť do Google Kalendára',
      parameters: {
        type: 'object',
        properties: {
          summary: {
            type: 'string',
            description: 'Názov udalosti'
          },
          description: {
            type: 'string',
            description: 'Popis udalosti'
          },
          startTime: {
            type: 'string',
            description: 'Začiatok v ISO 8601 formáte (napr. 2025-10-20T14:00:00+02:00)'
          },
          endTime: {
            type: 'string',
            description: 'Koniec v ISO 8601 formáte'
          },
          location: {
            type: 'string',
            description: 'Miesto konania'
          }
        },
        required: ['summary', 'startTime', 'endTime']
      }
    }
  }
];

// Spracovanie function calls
async function handleFunctionCall(functionName, args) {
  switch (functionName) {
    case 'list_events':
      return await listCalendarEvents();
    case 'add_event':
      return await addCalendarEvent(
        args.summary,
        args.description,
        args.startTime,
        args.endTime,
        args.location
      );
    default:
      return { error: 'Neznáma funkcia' };
  }
}

// Hlavný chat loop
async function chat() {
  console.log('🤖 ChatGPT Kalendár Asistent');
  console.log('📅 Pripojený k Google Kalendáru');
  console.log('💬 Píšte svoje otázky (alebo "exit" na ukončenie)\n');

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const messages = [
    {
      role: 'system',
      content: `Si asistent pre správu Google Kalendára. Pomáhaš používateľovi:
- Zobraziť udalosti z kalendára
- Pridávať nové udalosti
- Odpovedať na otázky o kalendári

Komunikuj v slovenčine. Keď používateľ chce pridať udalosť, opýtaj sa na všetky potrebné detaily (názov, čas, miesto).
Dátum a čas vždy formátuj ako ISO 8601 s timezone (napr. 2025-10-20T14:00:00+02:00).`
    }
  ];

  const askQuestion = () => {
    rl.question('Ty: ', async (userInput) => {
      if (userInput.toLowerCase() === 'exit') {
        console.log('👋 Dovidenia!');
        rl.close();
        return;
      }

      messages.push({
        role: 'user',
        content: userInput
      });

      try {
        let response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: messages,
          tools: tools,
          tool_choice: 'auto'
        });

        let responseMessage = response.choices[0].message;

        // Ak ChatGPT chce zavolať funkciu
        while (responseMessage.tool_calls) {
          messages.push(responseMessage);

          for (const toolCall of responseMessage.tool_calls) {
            const functionName = toolCall.function.name;
            const functionArgs = JSON.parse(toolCall.function.arguments);
            
            console.log(`🔧 Volám: ${functionName}...`);
            
            const functionResult = await handleFunctionCall(functionName, functionArgs);
            
            messages.push({
              role: 'tool',
              tool_call_id: toolCall.id,
              content: JSON.stringify(functionResult)
            });
          }

          // Získaj finálnu odpoveď
          response = await openai.chat.completions.create({
            model: 'gpt-4',
            messages: messages
          });

          responseMessage = response.choices[0].message;
        }

        messages.push(responseMessage);
        console.log(`\n🤖 Asistent: ${responseMessage.content}\n`);

      } catch (error) {
        console.error('❌ Chyba:', error.message);
      }

      askQuestion();
    });
  };

  askQuestion();
}

// Spustenie
if (!process.env.OPENAI_API_KEY) {
  console.error('❌ CHYBA: Nastavte OPENAI_API_KEY v .env súbore!');
  process.exit(1);
}

chat();

