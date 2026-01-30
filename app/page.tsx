'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/auth-modal';
import { useSession } from '@/lib/auth-client';

export default function Home() {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isPending && session?.user) {
      router.replace('/dashboard');
    }
  }, [session, isPending, router]);

  // Show loading while checking auth
  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">読み込み中...</div>
      </div>
    );
  }

  // If logged in, don't render LP (will redirect)
  if (session?.user) {
    return null;
  }

  return (
    <>
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />

      {/* Image Modal */}
      {isImageModalOpen && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setIsImageModalOpen(false)}
        >
          <img
            alt="LifeLog Dashboard Interface"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl cursor-zoom-out"
            src="/hero-screenshot.png"
          />
        </div>
      )}

      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md">
        <div className="max-w-[1100px] mx-auto px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl font-light">edit_note</span>
            <h1 className="text-lg font-medium tracking-widest uppercase">LifeLog</h1>
          </div>
          <nav className="hidden md:flex items-center gap-10">
            <a className="text-sm text-secondary hover:text-primary transition-colors" href="#features">機能</a>
            <a className="text-sm text-secondary hover:text-primary transition-colors" href="#mcp">MCP連携</a>
            <a className="text-sm text-secondary hover:text-primary transition-colors" href="#privacy">プライバシー</a>
          </nav>
          <div>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-primary text-white px-6 py-2 rounded text-sm font-medium minimal-btn hover:bg-neutral-800"
            >
              今すぐ始める
            </button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="section-padding pt-40 md:pt-60">
          <div className="max-w-[900px] mx-auto px-8 text-center">
            <div className="mb-12">
              <h2 className="text-4xl md:text-5xl font-bold leading-tight mb-8">
                日々の記録を、<br />AIが活用できる資産に。
              </h2>
              <p className="text-lg text-secondary max-w-2xl mx-auto leading-relaxed font-light">
                LifeLogは、あなたの思考、活動、学習をシンプルに蓄積。
                <br />独自のプロトコルを通じて、パーソナルAIの知性を進化させます。
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-6">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="bg-primary text-white px-10 py-4 rounded text-base font-medium min-w-[200px] minimal-btn hover:bg-neutral-800 shadow-sm"
              >
                今すぐ始める
              </button>
              <button className="text-primary border border-border px-10 py-4 rounded text-base font-medium min-w-[200px] minimal-btn hover:bg-neutral-50">
                デモを見る
              </button>
            </div>
            <div
              className="mt-24 border border-border rounded-lg overflow-hidden bg-neutral-50 p-4 shadow-sm max-w-4xl mx-auto cursor-pointer group"
              onClick={() => setIsImageModalOpen(true)}
            >
              <div className="aspect-video bg-white rounded border border-border flex items-center justify-center overflow-hidden relative">
                <img
                  alt="LifeLog Dashboard Interface"
                  className="w-full h-full object-cover"
                  src="/hero-screenshot.png"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center">
                  <span className="material-symbols-outlined text-white opacity-0 group-hover:opacity-100 transition-opacity text-4xl drop-shadow-lg">zoom_in</span>
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-2 text-center">クリックで拡大</p>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="section-padding bg-accent/50" id="features">
          <div className="max-w-[1100px] mx-auto px-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
              <div className="flex flex-col gap-6 items-start">
                <div className="w-10 h-10 border border-border flex items-center justify-center rounded bg-white">
                  <span className="material-symbols-outlined text-primary font-light">hub</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">MCP 連携</h3>
                  <p className="text-secondary leading-relaxed font-light">
                    Model Context Protocolに対応。お使いのLLMが、あなたのログを安全に参照・分析できるようになります。
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-6 items-start">
                <div className="w-10 h-10 border border-border flex items-center justify-center rounded bg-white">
                  <span className="material-symbols-outlined text-primary font-light">monitoring</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">自己評価の可視化</h3>
                  <p className="text-secondary leading-relaxed font-light">
                    感情や生産性を数値化し、日々のコンディションを美しいグラフで確認。成長を客観的に捉えます。
                  </p>
                </div>
              </div>
              <div className="flex flex-col gap-6 items-start">
                <div className="w-10 h-10 border border-border flex items-center justify-center rounded bg-white">
                  <span className="material-symbols-outlined text-primary font-light">task_alt</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-4">統合された記録</h3>
                  <p className="text-secondary leading-relaxed font-light">
                    タスク管理とジャーナリングを一つの場所で。思考の断片を逃さず、シームレスに資産化します。
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Section */}
        <section className="section-padding" id="privacy">
          <div className="max-w-[1100px] mx-auto px-8">
            <div className="flex flex-col lg:flex-row items-center gap-24">
              <div className="flex-1 space-y-12">
                <h2 className="text-3xl font-bold leading-snug">
                  情報の所有権を<br />あなたの手に。
                </h2>
                <div className="space-y-10">
                  <div className="flex gap-6">
                    <span className="material-symbols-outlined text-neutral-400 mt-1">shield</span>
                    <div>
                      <h4 className="font-bold mb-2">プライバシー第一</h4>
                      <p className="text-secondary font-light">データはローカル・ファースト。あなたの許可なく外部サーバーに保存されることはありません。</p>
                    </div>
                  </div>
                  <div className="flex gap-6">
                    <span className="material-symbols-outlined text-neutral-400 mt-1">bolt</span>
                    <div>
                      <h4 className="font-bold mb-2">高速な入力体験</h4>
                      <p className="text-secondary font-light">コマンドパレットとショートカットで、思いついた瞬間に記録を開始できます。</p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 w-full">
                <div className="relative">
                  <div className="aspect-square bg-neutral-100 rounded-2xl overflow-hidden border border-border">
                    <img
                      alt="Minimal writing interface"
                      className="w-full h-full object-cover grayscale opacity-80"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuA3X6tWgXnyKQsNb8hDgyc2mw4-q8q-YgSnHA6igHd4wEek_-6L2RjUz7OPIMMy6gk0H97YDt0ba1QtpK--PLrG9kckcql6vpSyTDTXJKAS4WfeOhdnCqetczI1Fb_Co9FjzHO3N2I99Ij-h2-HR48Sn5uwQo7T2fyyNr3RBhXITSiUAKxt5SbIpk_MnBXUP9fidjVDtw3pg8iXvfXOw42-qT2U43wzFGZ8-8TeOksvqsRybJ4iAv7dgoM7uQM9-_17FCCmifnqy2KZ"
                    />
                  </div>
                  <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-white border border-border p-4 rounded-lg hidden md:block shadow-sm">
                    <div className="w-full h-full bg-neutral-50 flex items-center justify-center border border-dashed border-neutral-300">
                      <span className="material-symbols-outlined text-neutral-300 text-4xl font-light">analytics</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="section-padding bg-neutral-50 border-t border-border">
          <div className="max-w-[700px] mx-auto px-8 text-center">
            <h2 className="text-3xl font-bold mb-10">さあ、記録を始めましょう。</h2>
            <p className="text-secondary mb-12 font-light">
              LifeLogは、あなたが日々何を感じ、何を学んだかを未来の自分へのギフトとして残します。
            </p>
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="bg-primary text-white px-12 py-5 rounded text-lg font-medium minimal-btn hover:bg-neutral-800 shadow-md"
            >
              今すぐ始める
            </button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-20 border-t border-border bg-white">
        <div className="max-w-[1100px] mx-auto px-8">
          <div className="flex flex-col md:flex-row justify-between items-start gap-12">
            <div className="space-y-6 max-w-xs">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-xl">edit_note</span>
                <span className="text-base font-bold tracking-widest">LIFELOG</span>
              </div>
              <p className="text-sm text-secondary leading-relaxed font-light">
                AI時代のパーソナル・ナレッジ・マネジメント。記録から洞察へ、そして知恵へ。
              </p>
            </div>
            <div className="grid grid-cols-2 gap-16 md:gap-24">
              <div className="space-y-6">
                <h5 className="text-xs font-bold uppercase tracking-widest text-primary">プロダクト</h5>
                <ul className="space-y-4 text-sm text-secondary font-light">
                  <li><a className="hover:text-primary transition-colors" href="#features">機能</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#mcp">MCPについて</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">料金</a></li>
                </ul>
              </div>
              <div className="space-y-6">
                <h5 className="text-xs font-bold uppercase tracking-widest text-primary">法的情報</h5>
                <ul className="space-y-4 text-sm text-secondary font-light">
                  <li><a className="hover:text-primary transition-colors" href="#">利用規約</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">プライバシー</a></li>
                  <li><a className="hover:text-primary transition-colors" href="#">サポート</a></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-20 pt-8 border-t border-neutral-100 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-neutral-400 uppercase tracking-widest font-light">
            <p>© 2024 LIFELOG INC.</p>
            <p>DESIGNED FOR CALM AND FOCUS</p>
          </div>
        </div>
      </footer>
    </>
  );
}
