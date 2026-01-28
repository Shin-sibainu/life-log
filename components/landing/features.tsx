import {
  ClipboardDocumentListIcon,
  ChartBarIcon,
  CpuChipIcon,
  LockClosedIcon,
} from '@heroicons/react/24/outline';

const features = [
  {
    name: 'To Do & 振り返り',
    description: '毎日のTo Doと振り返りを1箇所に集約。完了/未完了の管理と、各タスクへのメモ追加が可能。',
    icon: ClipboardDocumentListIcon,
  },
  {
    name: 'スコアで可視化',
    description: '1日の満足度を1〜10でスコアリング。グラフで推移を確認し、行動パターンを分析。',
    icon: ChartBarIcon,
  },
  {
    name: 'MCP連携',
    description: 'AIクライアントからライフログにアクセス。過去の記録を検索・分析して、AIアシスタントをパワーアップ。',
    icon: CpuChipIcon,
  },
  {
    name: 'プライバシーファースト',
    description: '認証なしでローカル保存可能。データはあなたのもの。必要なときだけクラウド同期。',
    icon: LockClosedIcon,
  },
];

export function Features() {
  return (
    <section id="features" className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-base font-semibold leading-7 text-indigo-600">機能</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            シンプルで、パワフル
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            必要なものだけを、必要なときに。
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2 xl:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-indigo-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
