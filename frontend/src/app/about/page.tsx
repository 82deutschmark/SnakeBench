export const runtime = 'nodejs';

export default function AboutPage() {
  return (
    <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="font-mono max-w-[800px] mx-auto text-sm">
        <section className="mb-10">
          <h1 className="text-2xl font-bold mb-6">Findings & Reflections</h1>
          
          <div className="mb-8">
            <h2 className="text-lg font-bold mb-3">Key Observations</h2>
            <ul className="space-y-4">
              <li>• LLMs often misinterpreted the board layout provided in text format. This led to cases where models incorrectly believed where their snake&apos;s head was or caused the snake to run into their own tail.</li>
              <li>• Lower-tier models (including GPT-3.5 Turbo and Haiku) struggled significantly, while GPT-4, Gemini 2.0, and o3-mini showed a baseline performance that allowed for an interesting game.</li>
              <li>• Context is key, you need to load the LLM up with a lot of information for it to make a good choice. Board position, apple location, other snakes position, etc.</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-8 mb-8">
            <h2 className="text-lg font-bold mb-3">Methodology</h2>
            <ul className="space-y-4">
              <li>• The board was provided in a textual format. This required the prompt to be explicit about the XY coordinate system. Without a true 2D representation, spatial reasoning was often lost in translation.</li>
              <li>• Each LLM took turns simultaneously. The turn-based mechanics highlighted internal chain-of-thought processes. I saved the model responses for analysis.</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-8 mb-8">
            <h2 className="text-lg font-bold mb-3">Analysis</h2>
            <ul className="space-y-4">
              <li>• The text-based board representation proved challenging for LLMs. Since the board is treated as tokens rather than a true 2D map, models often misjudged positions and made erroneous moves, such as running into walls or colliding with themselves.</li>
              <li>• While one idea was to restrict models to only legal moves to prevent such errors, doing so might narrow their strategic playing field, effectively handicapping their natural decision-making.</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-8 mb-8">
            <h2 className="text-lg font-bold mb-3">Future Work</h2>
            <ul className="space-y-4">
              <li>• With better models, use bigger board sizes.</li>
              <li>• Add more snakes, more apples, and add walls to the game.</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-8 mb-8">
            <h2 className="text-lg font-bold mb-3">Other Notes</h2>
            <ul className="space-y-4">
              <li>• Google models experienced unexpected rate limits despite being on a paid tier, resulting in fewer results and prompting a deeper dive into GCP settings.</li>
            </ul>
          </div>

          <div className="border-t border-gray-200 pt-8 mb-8">
            <h2 className="text-lg font-bold mb-3">Prompt Example</h2>
            <div className="bg-gray-50 p-4 rounded-md overflow-auto">
              <pre className="whitespace-pre-wrap break-words text-sm">
                {`You are controlling a snake in a multi-apple Snake game.The board size is 10x10. Normal X,Y coordinates are used. Coordinates range from (0,0) at bottom left to (9,9) at top right.

Apples at: (9, 6), (0, 2), (5, 9), (1, 7), (9, 7)

Your snake ID: 1 which is currently positioned at (5, 1)

Enemy snakes positions:
* Snake #2 is at position (7, 1) with body at []

Board state:

9 . . . . . A . . . .
8 . . . . . . . . . .
7 . A . . . . . . . A
6 . . . . . . . . . A
5 . . . . . . . . . .
4 . . . . . . . . . .
3 . . . . . . . . . .
2 A . . . . . . . . .
1 . . . . . 1 . 2 . .
0 . . . . . . . . . .
  0 1 2 3 4 5 6 7 8 9

--Your last move information:--

Direction: LEFT

Rationale: I'm noticing that (0,2) is the closest apple from our head at (6,1) (it's 7 steps away by Manhattan distance), and it's away from the enemy snake at (7,0). Right now our immediate options are:

• UP → goes to (6,2)
• RIGHT → goes to (7,1) (closer to the enemy snake's territory)
• LEFT → goes to (5,1)
• DOWN → goes to (6,0)

Moving RIGHT or DOWN brings us closer to the enemy snake at (7,0) or even out of safe bounds. Moving UP would work, but LEFT starts guiding us toward (0,2). Thus, I decide to move LEFT.

Strategy for future turns: I'll aim to continue left and then maneuver upward to reach the apple at (0,2) while remaining mindful of potential enemy moves.

My decided next move: LEFT.

--End of your last move information.--

Rules:
1) If you move onto an apple, you grow and gain 1 point.
    
2) If you run into a wall (outside the range of the listed coordinates), another snake, or yourself (like go backwards), you die.

3) The goal is to have the most points by the end.

Decreasing your x coordinate is to the left, increasing your x coordinate is to the right.

Decreasing your y coordinate is down, increasing your y coordinate is up.

You may think out loud first then respond with the direction.

You may also state a strategy you want to tell yourself next turn.

End your response with your decided next move: UP, DOWN, LEFT, or RIGHT.`}
              </pre>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
