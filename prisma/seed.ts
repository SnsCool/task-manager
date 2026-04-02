import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.helpArticle.createMany({
    data: [
      { title: 'ゴールの作成方法', content: 'サイドバーの「ゴール」メニューから「新規ゴール作成」ボタンをクリックし、タイトル（「〜する」形式）、期日、完了基準を入力してください。', category: 'getting_started', sortOrder: 1 },
      { title: 'サブゴールの追加', content: 'ゴール詳細ページの「サブゴール追加」ボタンから、親ゴールに紐づくサブゴールを作成できます。ツリー構造で階層的に管理されます。', category: 'getting_started', sortOrder: 2 },
      { title: 'メンバーの招待', content: '設定ページの「メンバー管理」からメールアドレスを入力して招待を送信できます。招待されたメンバーはメール内のリンクからチームに参加できます。', category: 'team', sortOrder: 3 },
      { title: 'デイリータスクの使い方', content: '「実行」ページで今日やるべきタスクを管理できます。ゴールと紐付けることで、日々の作業がどのゴールに貢献しているか可視化されます。', category: 'execution', sortOrder: 4 },
      { title: '通知の確認', content: 'サイドバーのベルアイコンから通知を確認できます。ゴールの割り当て、ステータス変更、コメント追加時に通知されます。', category: 'notifications', sortOrder: 5 },
      { title: 'ゴールのステータス管理', content: 'ゴールには「未着手」「進行中」「完了」「保留」の4つのステータスがあります。ステータスを変更すると活動履歴に記録されます。', category: 'goals', sortOrder: 6 },
      { title: '組織階層の設定', content: 'メンバー管理からマネージャーを設定することで、組織の階層構造を反映できます。', category: 'team', sortOrder: 7 },
      { title: '検索機能', content: 'ヘッダーの検索バーからゴールやメンバーを横断的に検索できます。キーワードを入力すると即座に結果が表示されます。', category: 'general', sortOrder: 8 },
    ],
    skipDuplicates: true,
  })

  console.log('Seed data created successfully')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
