'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50 to-white py-20 sm:py-32">
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            日々の記録を、
            <br />
            <span className="text-indigo-600">AIが活用できる資産に</span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            LifeLogは、1日のTo Do・学び・気づきを記録し、
            MCP連携でAIが過去のライフログを分析・活用できる「資産としての日記」サービスです。
          </p>
          <div className="mt-10 flex items-center justify-center gap-4">
            <Link href="/try">
              <Button size="lg">
                今すぐ始める
              </Button>
            </Link>
            <Link href="#features">
              <Button variant="outline" size="lg">
                機能を見る
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
