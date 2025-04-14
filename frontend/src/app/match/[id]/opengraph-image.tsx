import { ImageResponse } from 'next/og'

// Route segment config
export const runtime = 'edge'

// Image metadata
export const alt = 'LLM Snake Match Preview'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

// Simplified types for fetching
interface GameMetadata {
  models: Record<string, string>;
}
interface GameData {
  metadata: GameMetadata;
}

// Image generation
export default async function Image({ params }: { params: { id: string } }) {
  const { id } = params;

  try {
    // Fetch match data
    const gamesResponse = await fetch(`${process.env.FLASK_URL}/api/matches/${id}`, { next: { revalidate: 300 } });

    if (!gamesResponse.ok) {
      console.error(`[OG Image] Failed to fetch match data for ID ${id}. Status: ${gamesResponse.status}`);
      // Return a default image with error state
      return new ImageResponse(
        (
          <div
            style={{
              fontSize: 40,
              background: 'linear-gradient(to bottom right, #1F2937, #111827)',
              color: '#F3F4F6',
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              fontFamily: 'system-ui, sans-serif', // Use system fonts
            }}
          >
            LLM Snake - {gamesResponse.status === 404 ? 'Match Not Found' : 'Error Loading Match'}
          </div>
        ),
        {
          ...size,
          status: gamesResponse.status === 404 ? 404 : 500,
        }
      );
    }

    const gameData: GameData = await gamesResponse.json();

    // Get model names
    const modelIds = Object.keys(gameData.metadata.models);
    const modelNames = modelIds.map(id => gameData.metadata.models[id]);
    const player1 = modelNames[0] || 'Model 1';
    const player2 = modelNames[1] || 'Model 2';
    
    // Inline SVG paths (unchanged)
    const snake1Path = `M20,30 L40,30 L60,30 L80,30 L100,30 L120,30 L140,50 L140,70 L120,90 L100,90 L80,90 L60,90 L40,90 L20,70 L20,50 Z`;
    const snake2Path = `M180,130 L200,130 L220,130 L240,130 L260,130 L280,130 L300,110 L300,90 L280,70 L260,70 L240,70 L220,70 L200,70 L180,90 L180,110 Z`;

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#0F172A',
            backgroundImage: 'radial-gradient(circle at 25% 25%, rgba(99, 102, 241, 0.15) 0%, transparent 40%), radial-gradient(circle at 75% 75%, rgba(16, 185, 129, 0.15) 0%, transparent 40%)',
            color: 'white',
            fontFamily: 'system-ui, sans-serif', // Use system fonts
            padding: '40px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Background snake patterns */}
          <div style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: 0.1,
            top: 0,
            left: 0,
            display: 'flex'
          }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <svg
                key={`snake-${i}`}
                width="200"
                height="120"
                viewBox="0 0 320 160"
                style={{
                  position: 'absolute',
                  top: `${Math.random() * 80}%`,
                  left: `${Math.random() * 80}%`,
                  transform: `rotate(${Math.random() * 360}deg) scale(${0.8 + Math.random() * 0.4})`,
                  opacity: 0.3 + Math.random() * 0.7,
                }}
              >
                <path d={i % 2 === 0 ? snake1Path : snake2Path} fill={i % 2 === 0 ? "#10B981" : "#6366F1"} />
              </svg>
            ))}
          </div>

          {/* Main content */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1,
              width: '100%',
              padding: '2rem',
            }}
          >
            {/* Title */}
            <div
              style={{
                fontSize: 60,
                fontWeight: 'bold',
                letterSpacing: '-0.025em',
                color: 'white',
                marginBottom: '2rem',
                textAlign: 'center',
                textShadow: '0 4px 8px rgba(0, 0, 0, 0.2)',
              }}
            >
              LLM Snake Bench
            </div>
            
            {/* VS Section */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                marginBottom: '1.5rem',
              }}
            >
              {/* Player 1 */}
              <div
                style={{
                  backgroundColor: 'rgba(16, 185, 129, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: 40,
                  fontWeight: 'bold',
                  color: '#10B981', // Green
                  border: '2px solid #10B981',
                  marginRight: '1.5rem',
                  maxWidth: '400px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {player1}
              </div>
              
              {/* VS */}
              <div
                style={{
                  fontSize: 48,
                  fontWeight: 'bold',
                  margin: '0 1.5rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                }}
              >
                VS
              </div>
              
              {/* Player 2 */}
              <div
                style={{
                  backgroundColor: 'rgba(99, 102, 241, 0.2)',
                  borderRadius: '12px',
                  padding: '12px 24px',
                  fontSize: 40,
                  fontWeight: 'bold',
                  color: '#6366F1', // Indigo
                  border: '2px solid #6366F1',
                  marginLeft: '1.5rem',
                  maxWidth: '400px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {player2}
              </div>
            </div>
            
            {/* Tagline */}
            <div
              style={{
                fontSize: 28,
                color: 'rgba(255, 255, 255, 0.7)',
                marginTop: '1rem',
              }}
            >
              Watch LLMs control snakes
            </div>
          </div>
        </div>
      ),
      {
        ...size,
      }
    );
  } catch (error) {
    console.error(`[OG Image] Error generating image for ID ${id}:`, error);
    // Simplified generic error response
    return new Response(`Server Error: Failed to generate OG Image`, { status: 500 });
  }
} 