import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function Cta() {
  return (
    <section className="bg-indigo-600 py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            今日から始めよう
          </h2>
          <p className="mt-6 text-lg leading-8 text-indigo-100">
            アカウント不要で即座に体験。<br />
            書いた内容は後からアカウントに紐付け可能。
          </p>
          <div className="mt-10">
            <Link href="/try">
              <Button
                size="lg"
                className="bg-white text-indigo-600 hover:bg-indigo-50"
              >
                無料で始める
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
