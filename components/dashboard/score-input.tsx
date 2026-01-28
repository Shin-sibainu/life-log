'use client';

interface ScoreInputProps {
  score: number | null;
  scoreReason: string | null;
  onScoreChange: (score: number | null) => void;
  onScoreReasonChange: (reason: string | null) => void;
}

export function ScoreInput({ score, scoreReason, onScoreChange, onScoreReasonChange }: ScoreInputProps) {
  const currentScore = score ?? 5;

  return (
    <section>
      <h3 className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-4 flex items-center gap-2">
        <span className="size-4 border-b border-slate-300" />
        今日の満足度
      </h3>
      <div className="border border-slate-200 rounded-lg p-6 space-y-6">
        <div className="flex flex-col items-center gap-8">
          <p className="text-4xl font-light text-slate-900 tabular-nums">
            {currentScore} <span className="text-base text-slate-400">/ 10</span>
          </p>
          <div className="w-full">
            <input
              type="range"
              min="1"
              max="10"
              value={currentScore}
              onChange={(e) => onScoreChange(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-3 text-xs text-slate-400 uppercase tracking-wide">
              <span>Low</span>
              <span>High</span>
            </div>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 mb-2 block">この点数の理由</label>
          <textarea
            value={scoreReason || ''}
            onChange={(e) => onScoreReasonChange(e.target.value || null)}
            placeholder="今日の満足度の理由を書いてみましょう..."
            rows={3}
            className="w-full p-3 border border-slate-200 rounded-lg text-sm leading-relaxed text-slate-800 placeholder:text-slate-400 resize-none bg-transparent outline-none focus:outline-none focus:border-slate-300 text-pretty"
          />
        </div>
      </div>
    </section>
  );
}
