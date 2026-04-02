# PRD: KPI階層型タスク管理ツール

## 1. エグゼクティブサマリー

### 背景
AI活用を全社展開する中で、以下の構造的課題がボトルネックになっている：
- タスクは自動生成できるが、KPIとの紐付けがなく「何のためにやるか」が不明
- 振り返りに必要なデータが揃っていない/散在している
- KGI→KPI→課題→タスク→実行ログの一気通貫の階層構造が存在しない
- ナレッジが個人に閉じ、AIが活用できるデータになっていない

### 目指す状態
**KPI階層に紐づいたタスク管理ツールを全社導入し、全てのデータが自動で正しい構造に格納される。**

スタッフがKPI構造を完全に理解していなくても、ツールの仕組み上その形式でしか業務が動かない状態を作る。

### 対象ユーザー

| ロール | 人数規模 | 主な操作 |
|--------|----------|----------|
| 経営・幹部 | 少数 | KGI/KPI設計、ダッシュボード閲覧 |
| マネージャー | 各部署1-2名 | KPI→課題分解、進捗モニタリング、データ分析 |
| 一般スタッフ | 全社員 | タスク実行、実行ログ入力、ナレッジ共有 |
| システム管理者 | 1-2名 | 連携設定、マスタ管理 |

### 対象部署とデータ整備状況

| 部署 | データ整備度 | 優先度 | 備考 |
|------|-------------|--------|------|
| 営業 | ◎ | Phase 1 | データ揃っている。先行導入に最適 |
| CS | ○ | Phase 1 | 比較的データあり |
| マーケ | ○ | Phase 2 | 他部署依存多い |
| サポートMG | △ | Phase 2 | データ整備が必要 |
| メディア | △ | Phase 2 | データ整備が必要 |
| コーチング | × | Phase 3 | データ基盤構築から |
| 講師MG | × | Phase 3 | データ基盤構築から |
| 人事 | × | Phase 3 | データ基盤構築から |

---

## 2. データモデル設計

### 2.1 階層構造の定義

```
Department（部署）
  └── KGI（経営目標）
       └── KPI（重要業績指標）
            └── Issue（課題）
                 └── Task（タスク）
                      └── ExecutionLog（実行ログ）
```

### 2.2 既存モデルとのマッピング

| 新概念 | 既存モデル | 対応方針 |
|--------|-----------|----------|
| Department | Team | Teamモデルを拡張（部署概念を追加） |
| KGI | Goal (depth=0) | Goalに`goal_type`フィールドを追加 |
| KPI | Goal (depth=1) | 同上。計測値フィールドを追加 |
| Issue | Goal (depth=2) | 同上 |
| Task | DailyTask / Goal (depth=3) | DailyTaskを拡張、Goal連携を必須化 |
| ExecutionLog | （新規） | 新規モデル追加 |

### 2.3 新規・拡張モデル定義

#### Department（部署）— Teamモデル拡張

```prisma
model Team {
  id         String   @id @default(uuid())
  name       String
  logo_url   String?
  
  // === 新規フィールド ===
  parent_id    String?          // 親部署（組織階層用）
  department_type String @default("department") // "company" | "division" | "department" | "team"
  
  parent     Team?    @relation("TeamHierarchy", fields: [parent_id], references: [id])
  children   Team[]   @relation("TeamHierarchy")
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

#### Goal（KGI/KPI/Issue統合）— 既存モデル拡張

```prisma
model Goal {
  id          String   @id @default(uuid())
  team_id     String
  parent_id   String?
  title       String
  description String?
  
  // === 新規フィールド ===
  goal_type   String   @default("task")  
  // "kgi" | "kpi" | "issue" | "task"
  // depth=0→kgi, depth=1→kpi, depth=2→issue, depth=3→task として自動判定も可
  
  // KPI計測用フィールド
  metric_name     String?   // 指標名（例: "月次売上", "解約率"）
  metric_unit     String?   // 単位（例: "円", "%", "件"）
  metric_target   Float?    // 目標値
  metric_current  Float?    // 現在値（最新のMetricSnapshotから自動更新）
  metric_formula  String?   // 算出式（他KPIからの計算用）
  
  // 期間設定
  period_type     String?   // "monthly" | "quarterly" | "yearly" | "custom"
  period_start    DateTime?
  period_end      DateTime?
  
  // 既存フィールド（変更なし）
  status              String   @default("not_started")
  priority            String   @default("medium")
  start_date          DateTime?
  due_date            DateTime?
  completion_criteria String?
  progress            Int      @default(0)
  created_by          String
  path                String   @default("")
  depth               Int      @default(0)
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
}
```

#### MetricSnapshot（KPI計測値の時系列記録）— 新規

```prisma
model MetricSnapshot {
  id        String   @id @default(uuid())
  goal_id   String   // KPIへの参照
  value     Float    // 計測値
  recorded_at DateTime @default(now())
  source    String?  // データソース（"manual" | "api" | "discord" | "sheet"）
  recorded_by String? // 入力者（手動の場合）
  note      String?  // メモ
  
  goal      Goal     @relation(fields: [goal_id], references: [id], onDelete: Cascade)
  
  @@index([goal_id, recorded_at])
}
```

#### ExecutionLog（実行ログ）— 新規

```prisma
model ExecutionLog {
  id           String   @id @default(uuid())
  task_id      String   // DailyTask or Goal(type=task)への参照
  profile_id   String   // 実行者
  team_id      String
  
  log_type     String   // "progress" | "blocker" | "completion" | "note" | "auto_discord" | "auto_meet"
  content      String   // ログ内容
  
  // 自動取り込み用メタデータ
  source       String   @default("manual") // "manual" | "discord" | "meet" | "api"
  source_id    String?  // 元データのID（Discordメッセージ ID等）
  source_url   String?  // 元データへのリンク
  
  // KPI紐付け（どのKPIに影響したか）
  related_goal_id String? // 紐づくKPI/KGI
  metric_impact   Float?  // この実行によるKPI変動値
  
  created_at   DateTime @default(now())
  
  task         DailyTask? @relation(fields: [task_id], references: [id], onDelete: Cascade)
  profile      Profile    @relation(fields: [profile_id], references: [id])
  team         Team       @relation(fields: [team_id], references: [id])
  related_goal Goal?      @relation(fields: [related_goal_id], references: [id])
  
  @@index([task_id])
  @@index([profile_id, created_at])
  @@index([team_id, created_at])
  @@index([source, source_id])
}
```

#### DailyTask拡張

```prisma
model DailyTask {
  id           String   @id @default(uuid())
  team_id      String
  profile_id   String
  title        String
  is_completed Boolean  @default(false)
  goal_id      String?  // 既存（任意）
  due_date     DateTime @default(now())
  sort_order   Int      @default(0)
  
  // === 新規フィールド ===
  // KPI紐付け必須化（goal_idがnullの場合の代替）
  kpi_goal_id  String?  // 直接KPIへの紐付け（goal_idから自動推論も可）
  
  // 実行管理
  estimated_hours Float?   // 見積もり時間
  actual_hours    Float?   // 実績時間
  completed_at    DateTime? // 完了日時
  
  // 自動生成メタデータ
  source       String   @default("manual") // "manual" | "discord" | "meet" | "ai_suggest"
  source_id    String?  // 元データのID
  confidence   Float?   // AI生成時の確信度（0-1）
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  execution_logs ExecutionLog[]
}
```

#### KnowledgeEntry（ナレッジ共有）— 新規

```prisma
model KnowledgeEntry {
  id          String   @id @default(uuid())
  team_id     String
  profile_id  String   // 作成者
  
  title       String
  content     String   // Markdown形式
  category    String   // "sales_technique" | "cs_playbook" | "onboarding" | "troubleshooting" etc.
  
  // KPI階層への紐付け
  related_goal_id String? // どのKPI/課題に関連するか
  
  // メタデータ
  tags        String[] // タグ（検索用）
  source      String   @default("manual") // "manual" | "meet_transcript" | "discord" | "ai_extracted"
  source_url  String?
  
  // 評価
  usefulness_score Float @default(0) // 有用性スコア（いいね等から算出）
  view_count       Int   @default(0)
  
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  
  team    Team    @relation(fields: [team_id], references: [id])
  profile Profile @relation(fields: [profile_id], references: [id])
  goal    Goal?   @relation(fields: [related_goal_id], references: [id])
  
  @@index([team_id, category])
  @@index([related_goal_id])
}
```

---

## 3. 画面設計

### 3.1 画面一覧

| # | 画面名 | パス | 対象ロール | Phase |
|---|--------|------|-----------|-------|
| 1 | KPIツリービュー | `/kpi-tree` | 全員 | 1 |
| 2 | KPIダッシュボード | `/dashboard` | マネージャー以上 | 1 |
| 3 | タスク実行（拡張） | `/execution` | 全員 | 1 |
| 4 | KPI詳細 | `/kpi/:id` | 全員 | 1 |
| 5 | ゴール詳細（拡張） | `/goals/:id` | 全員 | 1 |
| 6 | 実行ログタイムライン | `/logs` | 全員 | 2 |
| 7 | データ入力フォーム | `/metrics/input` | 担当者 | 2 |
| 8 | AI自動タスク確認 | `/ai-tasks` | 全員 | 2 |
| 9 | ナレッジベース | `/knowledge` | 全員 | 3 |
| 10 | 部署別レポート | `/reports/:dept` | マネージャー以上 | 3 |
| 11 | 連携設定 | `/settings/integrations` | 管理者 | 2 |

### 3.2 主要画面の詳細

---

#### 画面1: KPIツリービュー（`/kpi-tree`）

**目的**: KGI→KPI→課題→タスクの階層構造を一目で把握する。「このタスクは何のためにやるか」が誰でもわかる。

**レイアウト**:
```
┌─────────────────────────────────────────────────────┐
│  [部署フィルタ▼]  [期間▼]  [表示: ツリー | リスト]  │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ▼ 🎯 KGI: 年間売上10億円達成                       │
│  │  進捗: ████████░░ 78%   目標: 10億  現在: 7.8億  │
│  │                                                  │
│  ├─ ▼ 📊 KPI: 月次新規契約数 40件                   │
│  │  │  進捗: ██████░░░░ 60%  目標: 40件  現在: 24件 │
│  │  │                                               │
│  │  ├─ ▼ ⚠️ 課題: リード獲得数が不足                │
│  │  │  │  ステータス: 進行中                         │
│  │  │  │                                            │
│  │  │  ├─ ☐ タスク: LP改善のA/Bテスト実施    @田中  │
│  │  │  │   期限: 4/10  KPI寄与: +5件/月（見込み）   │
│  │  │  │                                            │
│  │  │  └─ ☑ タスク: 広告予算の再配分        @佐藤   │
│  │  │      完了: 3/28  実績: +3件/月                 │
│  │  │                                               │
│  │  └─ ▼ ⚠️ 課題: 商談→契約の転換率が低い          │
│  │     │                                            │
│  │     └─ ☐ タスク: 商談スクリプト改善      @鈴木   │
│  │                                                  │
│  └─ ▼ 📊 KPI: 解約率 3%以下                        │
│     │  進捗: ████░░░░░░ 40%  目標: 3%  現在: 5%    │
│     ...                                             │
└─────────────────────────────────────────────────────┘
```

**機能要件**:
- 階層の展開/折りたたみ（デフォルトはKPIレベルまで展開）
- 各ノードにアイコン: KGI=🎯, KPI=📊, 課題=⚠️, タスク=☐/☑
- KPI/KGIノードには進捗バー + 目標値 vs 現在値を表示
- タスクノードには担当者・期限・KPI寄与見込みを表示
- クリックで詳細画面へ遷移
- ドラッグ&ドロップで階層移動（マネージャー以上）
- 「+」ボタンで子要素を追加（階層に応じたフォームを自動選択）

**構造強制ルール**:
- KGIの子はKPIのみ
- KPIの子は課題のみ
- 課題の子はタスクのみ
- タスクは必ず課題の下に存在する（孤立タスク不可）
- 新規タスク作成時、紐づく課題→KPI→KGIが自動表示される

---

#### 画面2: KPIダッシュボード（`/dashboard`）

**目的**: 全KPIの達成状況を俯瞰し、未達KPIに素早くフォーカスする。

**レイアウト**:
```
┌──────────────────────────────────────────────────────┐
│  KPIダッシュボード        [部署▼] [期間: 2026年4月▼] │
├──────────┬──────────┬──────────┬──────────────────────┤
│ 全KPI数  │ 達成     │ 未達     │ 未計測              │
│   12     │   5 ✅   │   4 🔴   │   3 ⚪              │
├──────────┴──────────┴──────────┴──────────────────────┤
│                                                      │
│  ┌─ 要注意KPI ──────────────────────────────────┐    │
│  │ 🔴 解約率: 5% → 目標3%     担当: CSチーム    │    │
│  │    原因課題: オンボーディング完了率低下       │    │
│  │    対策タスク: 3件中1件完了                   │    │
│  │    [詳細を見る] [フォローアップを作成]         │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ KPI推移グラフ ─────────────────────────────┐     │
│  │  [月次新規契約数]                            │     │
│  │  40 ─ ─ ─ ─ ─ ─ ─ ─ 目標ライン             │     │
│  │  30 ──╱──                                   │     │
│  │  20 ╱                                       │     │
│  │  10                                          │     │
│  │   1月  2月  3月  4月                         │     │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ 部署別サマリー ────────────────────────────┐     │
│  │ 営業     ████████░░  80%  KPI 4/5達成       │     │
│  │ CS       ██████░░░░  60%  KPI 3/5達成       │     │
│  │ マーケ   ████░░░░░░  40%  KPI 2/5達成       │     │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

**機能要件**:
- KPI達成率のサマリーカード（達成/未達/未計測）
- 要注意KPI（未達かつ期限間近）のハイライト表示
- KPI推移の折れ線グラフ（MetricSnapshotから描画）
- 部署別の達成サマリー
- 未達KPIから直接フォローアップタスクを作成可能
- 期間フィルタ（月次/四半期/年次）

---

#### 画面3: タスク実行ビュー（`/execution` 拡張）

**目的**: 日次のタスク実行に集中しつつ、各タスクのKPI上の意味が常に見える状態。

**レイアウト**:
```
┌──────────────────────────────────────────────────────┐
│  今日のタスク  2026/04/02(水)    完了: 3/7 (43%)     │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📊 月次新規契約数 40件（KPI）                       │
│  ├─ ☑ LP改善のA/Bテスト結果分析         @自分  1h   │
│  │   └─ 💬 実行ログ: CVR 2.3%→3.1%に改善確認       │
│  ├─ ☐ 新規リード向けメール文面作成       @自分  2h   │
│  │   └─ 🏷️ KPI寄与: リード獲得数 +10件/月（見込み）│
│  └─ ☐ 広告クリエイティブ3案作成         @自分  3h   │
│                                                      │
│  📊 解約率 3%以下（KPI）                             │
│  ├─ ☐ 解約予兆顧客リストのフォロー      @自分  1h   │
│  └─ ☐ オンボーディング動画の更新        @自分  2h   │
│                                                      │
│  ⚡ AI提案タスク（未確定）                           │
│  ├─ 💡 昨日のMTGから: 競合分析レポート作成           │
│  │   [承認] [編集して承認] [却下]                    │
│  └─ 💡 Discordから: FAQ更新（質問3件検出）           │
│      [承認] [編集して承認] [却下]                    │
│                                                      │
│  ─── タスク完了時 ───                                │
│  ☑ タスク名をクリック → 実行ログ入力ダイアログ       │
│  │  ┌────────────────────────────────┐               │
│  │  │ 何をしたか: [________________] │               │
│  │  │ 結果/成果:  [________________] │               │
│  │  │ 所要時間:   [__h __m]          │               │
│  │  │ KPI影響:    [自動推定 or 手入力]│               │
│  │  │         [保存]  [スキップ]      │               │
│  │  └────────────────────────────────┘               │
│                                                      │
│  [+ タスクを追加]                                    │
└──────────────────────────────────────────────────────┘
```

**機能要件**:
- タスクをKPI別にグルーピング表示（「何のためにやるか」が常に見える）
- タスク完了時に実行ログ入力ダイアログを表示（スキップ可だが推奨）
- AI提案タスク（Discord/Meetから自動生成）の承認/却下セクション
- タスク追加時はKPI→課題の紐付けが必須（ドリルダウン選択UI）
- 見積もり時間と実績時間の記録
- KPI寄与の見込み値表示

**構造強制**:
- タスク作成フォームでは「どのKPIに貢献するか」の選択が必須
- 選択フローは `KPI選択 → 課題選択（or新規作成）→ タスク入力`
- ワンクリックで「このタスクの上位KGI」まで辿れるパンくずリスト表示

---

#### 画面8: AI自動タスク確認（`/ai-tasks`）

**目的**: AIが自動生成したタスク候補を一覧で確認・承認する。

**レイアウト**:
```
┌──────────────────────────────────────────────────────┐
│  AI提案タスク           [ソース▼] [日付▼] [部署▼]   │
├──────────────────────────────────────────────────────┤
│                                                      │
│  📅 2026/04/02 — 3件の提案                           │
│                                                      │
│  ┌─ Discord #営業チーム 14:32 ────────────────────┐  │
│  │ 💬 元メッセージ:                               │  │
│  │ 「ABCコーポの提案書、金曜までに修正版送る」    │  │
│  │                                                │  │
│  │ 📝 提案タスク:                                 │  │
│  │ タイトル: ABCコーポ提案書修正版作成             │  │
│  │ 担当: 田中                                     │  │
│  │ 期限: 2026/04/04                               │  │
│  │ 紐付KPI: 月次新規契約数（確信度: 85%）         │  │
│  │ 紐付課題: 商談→契約の転換率改善                │  │
│  │                                                │  │
│  │ [✅ 承認] [✏️ 編集して承認] [❌ 却下] [🔗 紐付変更] │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  ┌─ Google Meet 「週次営業MTG」 10:00-11:00 ─────┐  │
│  │ 📝 抽出タスク（2件）:                          │  │
│  │                                                │  │
│  │ 1. 新規リードへのアプローチリスト作成           │  │
│  │    担当: 佐藤  期限: 4/5                       │  │
│  │    紐付KPI: リード獲得数（確信度: 92%）        │  │
│  │    [✅] [✏️] [❌] [🔗]                         │  │
│  │                                                │  │
│  │ 2. 競合A社の価格調査                           │  │
│  │    担当: 鈴木  期限: 4/7                       │  │
│  │    紐付KPI: 商談転換率（確信度: 65%）          │  │
│  │    [✅] [✏️] [❌] [🔗]                         │  │
│  └────────────────────────────────────────────────┘  │
│                                                      │
│  [一括承認（確信度80%以上）]                          │
└──────────────────────────────────────────────────────┘
```

**機能要件**:
- ソース別（Discord/Meet/手動）でフィルタリング
- AI確信度の表示（KPI紐付けの確からしさ）
- 元データ（メッセージ/議事録）へのリンク
- 一括承認機能（確信度閾値設定可能）
- 却下理由の記録（AI学習用フィードバック）
- KPI紐付けの変更UI

---

#### 画面9: ナレッジベース（`/knowledge`）

**目的**: 個人に閉じていたノウハウを構造化して全社共有する。

**機能要件**:
- Markdown形式でナレッジ作成・編集
- KPI/課題への紐付け
- カテゴリ・タグでの分類と検索
- Meet議事録/商談録音からの自動抽出（AI）
- 閲覧数・有用性スコアによるランキング
- AI検索（自然言語での質問→関連ナレッジを返答）

---

## 4. API設計方針

### 4.1 新規エンドポイント

| メソッド | パス | 説明 | Phase |
|----------|------|------|-------|
| GET | `/api/kpi-tree` | KPI階層ツリー取得 | 1 |
| GET | `/api/kpi-tree/:id/descendants` | 指定ノード以下の全階層 | 1 |
| POST | `/api/goals` (拡張) | goal_type付きゴール作成 | 1 |
| PATCH | `/api/goals/:id` (拡張) | metric系フィールド更新対応 | 1 |
| GET | `/api/dashboard/summary` | KPIダッシュボード集計 | 1 |
| GET | `/api/dashboard/department/:id` | 部署別KPI集計 | 1 |
| POST | `/api/metrics/:goalId/snapshot` | KPI計測値記録 | 1 |
| GET | `/api/metrics/:goalId/history` | KPI計測値履歴 | 1 |
| POST | `/api/execution-logs` | 実行ログ作成 | 1 |
| GET | `/api/execution-logs` | 実行ログ一覧（フィルタ付き） | 1 |
| POST | `/api/ai-tasks/suggest` | AI提案タスク生成 | 2 |
| PATCH | `/api/ai-tasks/:id/approve` | AI提案タスク承認 | 2 |
| PATCH | `/api/ai-tasks/:id/reject` | AI提案タスク却下 | 2 |
| POST | `/api/ingest/discord` | Discordメッセージ取り込み | 2 |
| POST | `/api/ingest/meet` | Meet議事録取り込み | 2 |
| POST | `/api/knowledge` | ナレッジ作成 | 3 |
| GET | `/api/knowledge/search` | ナレッジ検索 | 3 |
| GET | `/api/reports/:departmentId` | 部署別レポート生成 | 3 |

### 4.2 構造強制のバリデーション

```typescript
// タスク作成時のバリデーション例
const createTaskSchema = {
  title: z.string().min(1),
  goal_id: z.string().uuid(),  // 必須 — 課題(issue)への紐付け
  // goal_id の参照先が goal_type="issue" であることをサーバーサイドで検証
  // issue の親が KPI、KPI の親が KGI であることを自動検証
  profile_id: z.string().uuid(),
  due_date: z.string().datetime(),
  estimated_hours: z.number().optional(),
}
```

### 4.3 KPI紐付け自動推論

タスクにgoal_id（課題）が設定されると、サーバーサイドで自動的に：
1. 課題の親KPIを取得 → `kpi_goal_id` を自動セット
2. KPIの親KGIを取得 → パンくず情報として返却
3. タスクの `path` フィールドに `/{kgi_id}/{kpi_id}/{issue_id}/{task_id}` を格納

---

## 5. AI自動データ格納アーキテクチャ

### 5.1 全体フロー

```
┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│ Discord  │    │ Google   │    │  手動    │    │ 外部API  │
│ Bot/     │    │ Meet     │    │  入力    │    │ (Sheets  │
│ Webhook  │    │ 録音     │    │          │    │  等)     │
└────┬─────┘    └────┬─────┘    └────┬─────┘    └────┬─────┘
     │               │               │               │
     ▼               ▼               ▼               ▼
┌────────────────────────────────────────────────────────┐
│              Ingest API Layer                          │
│  /api/ingest/discord  /api/ingest/meet  /api/ingest/* │
└────────────────────────┬───────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   AI Processing     │
              │   (Claude API)      │
              │                     │
              │  1. 内容解析        │
              │  2. タスク抽出      │
              │  3. KPI紐付け推論   │
              │  4. 担当者推定      │
              │  5. 期限推定        │
              │  6. 確信度スコア    │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Staging Table      │
              │  (AiSuggestedTask)  │
              │                     │
              │  status: pending    │
              │  confidence: 0.85   │
              └──────────┬──────────┘
                         │
                    ┌────┴────┐
                    ▼         ▼
              [承認]        [却下]
                │             │
                ▼             ▼
         DailyTask作成   フィードバック
         ExecutionLog    としてAI学習に
         自動生成        活用
```

### 5.2 AiSuggestedTask（AI提案タスク）— 新規モデル

```prisma
model AiSuggestedTask {
  id            String   @id @default(uuid())
  team_id       String
  
  // 提案内容
  title         String
  description   String?
  suggested_assignee_id String?  // 推定担当者
  suggested_due_date    DateTime?
  suggested_goal_id     String?  // 推定KPI紐付け先
  
  // AI処理メタデータ
  source        String   // "discord" | "meet" | "api"
  source_id     String   // 元データID
  source_content String  // 元データの内容（参照用）
  confidence    Float    // KPI紐付けの確信度 (0-1)
  ai_reasoning  String?  // AIの推論根拠
  
  // 承認管理
  status        String   @default("pending") // "pending" | "approved" | "rejected" | "modified"
  reviewed_by   String?  // 承認/却下した人
  reviewed_at   DateTime?
  rejection_reason String? // 却下理由（AI学習用）
  
  // 承認後にDailyTaskに変換された場合のリンク
  created_task_id String? @unique
  
  created_at    DateTime @default(now())
  
  @@index([team_id, status])
  @@index([source, created_at])
}
```

### 5.3 Discord連携の具体仕様

```yaml
Discord連携:
  入力:
    方式: Discord Bot + Webhook
    監視対象: 指定チャンネル（部署ごとに設定）
    トリガー:
      - 定期スキャン（15分間隔）
      - リアクション（📝 絵文字でタスク化要求）
      - メンション（@TaskBot でタスク化要求）
  
  AI処理:
    モデル: Claude API (claude-sonnet-4-6)
    プロンプト構造:
      - システム: KPI階層構造の定義、部署のKPI一覧
      - ユーザー: Discordメッセージ群
      - 出力: タスク候補JSON（タイトル、担当、期限、KPI紐付け、確信度）
    
  出力:
    - AiSuggestedTask テーブルに格納
    - 確信度90%以上: 自動承認オプション（設定で切替可能）
    - 確信度50%未満: 自動却下（ログのみ保存）
```

### 5.4 Google Meet連携の具体仕様

```yaml
Meet連携:
  入力:
    方式: Google Meet録音 → Speech-to-Text → テキスト
    トリガー: Meet終了後に自動処理（Google Cloud Functions）
    
  AI処理:
    モデル: Claude API (claude-sonnet-4-6)
    プロンプト構造:
      - システム: KPI階層構造の定義、参加者リスト
      - ユーザー: 議事録テキスト
      - 出力:
        1. 議事録要約
        2. タスク候補JSON
        3. ナレッジ候補（重要な議論・決定事項）
    
  出力:
    - AiSuggestedTask テーブルに格納
    - KnowledgeEntry テーブルにも候補を格納
    - ExecutionLog に議事録リンクを記録
```

---

## 6. MCP連携設計

### 6.1 提供するMCPツール

```yaml
MCP Server:
  name: "task-manager-mcp"
  
  tools:
    - name: "get_kpi_tree"
      description: "KPI階層ツリーを取得"
      params: { team_id, depth?, goal_type? }
      
    - name: "get_kpi_status"
      description: "指定KPIの達成状況を取得"
      params: { goal_id }
      
    - name: "search_tasks"
      description: "タスクを検索"
      params: { query, assignee?, status?, kpi_id? }
      
    - name: "get_execution_logs"
      description: "実行ログを取得"
      params: { task_id?, profile_id?, date_from?, date_to? }
      
    - name: "search_knowledge"
      description: "ナレッジを検索"
      params: { query, category?, related_kpi? }
      
    - name: "create_task"
      description: "タスクを作成（KPI紐付け必須）"
      params: { title, goal_id, assignee_id, due_date }
      
    - name: "record_metric"
      description: "KPI計測値を記録"
      params: { goal_id, value, source? }
```

### 6.2 利用シーン

- **Claude（チャット）**: 「営業のKPI達成状況を教えて」→ `get_kpi_tree` + `get_kpi_status`
- **Cursor（開発）**: コード変更がどのKPIに関連するか確認 → `search_tasks`
- **AIエージェント**: 定期的にKPI未達を検知し、フォローアップタスクを自動提案

---

## 7. フェーズ別リリース計画

### Phase 1: KPI階層基盤（4-6週間）

**目標**: 既存のGoal/DailyTaskを拡張し、KPI階層でタスク管理できる状態にする。

| # | タスク | 工数目安 |
|---|--------|----------|
| 1-1 | Goalモデルにgoal_type, metric系フィールド追加（Prismaマイグレーション） | 2日 |
| 1-2 | MetricSnapshotモデル追加 | 1日 |
| 1-3 | ExecutionLogモデル追加 | 1日 |
| 1-4 | DailyTaskモデル拡張（kpi_goal_id, source等） | 1日 |
| 1-5 | KPIツリーAPI（`/api/kpi-tree`）実装 | 3日 |
| 1-6 | KPIダッシュボードAPI（`/api/dashboard`）実装 | 3日 |
| 1-7 | MetricSnapshot API実装 | 2日 |
| 1-8 | ExecutionLog API実装 | 2日 |
| 1-9 | KPIツリービュー画面 | 5日 |
| 1-10 | KPIダッシュボード画面 | 5日 |
| 1-11 | タスク実行画面の拡張（KPI別グルーピング、実行ログ入力） | 3日 |
| 1-12 | タスク作成フォームの構造強制（KPI紐付け必須） | 2日 |
| 1-13 | 既存データのマイグレーション（既存Goalへのgoal_type付与） | 2日 |

**先行導入**: 営業部・CS部

**Phase 1完了基準**:
- [ ] KGI→KPI→課題→タスクの階層でデータが作成できる
- [ ] タスク作成時にKPI紐付けが必須になっている
- [ ] KPIの目標値/現在値が記録・表示できる
- [ ] タスク完了時に実行ログを記録できる
- [ ] KPIダッシュボードで達成状況が可視化される

---

### Phase 2: AI自動データ格納（4-6週間）

**目標**: Discord/MeetからAIがタスクを自動生成し、人間が承認する仕組みを構築する。

| # | タスク | 工数目安 |
|---|--------|----------|
| 2-1 | AiSuggestedTaskモデル追加 | 1日 |
| 2-2 | Discord Bot実装（メッセージ監視・取り込み） | 5日 |
| 2-3 | AI処理パイプライン実装（Claude API連携） | 5日 |
| 2-4 | KPI紐付け推論ロジック実装 | 3日 |
| 2-5 | AI提案タスク確認画面 | 4日 |
| 2-6 | 承認/却下フロー実装 | 2日 |
| 2-7 | Google Meet連携（録音→文字起こし→タスク抽出） | 5日 |
| 2-8 | 連携設定画面の拡張 | 2日 |
| 2-9 | MetricSnapshot自動取り込み（スプレッドシート連携） | 3日 |
| 2-10 | 実行ログタイムライン画面 | 3日 |

**Phase 2完了基準**:
- [ ] DiscordメッセージからAIがタスク候補を自動生成する
- [ ] Meet議事録からタスクが自動抽出される
- [ ] AI提案タスクの承認/却下フローが動作する
- [ ] KPI計測値がスプレッドシートから自動取り込みされる
- [ ] 確信度に基づく自動承認が設定可能

---

### Phase 3: ナレッジ・レポート・全社展開（4-6週間）

**目標**: ナレッジ共有基盤を構築し、全部署に展開する。

| # | タスク | 工数目安 |
|---|--------|----------|
| 3-1 | KnowledgeEntryモデル追加 | 1日 |
| 3-2 | ナレッジベース画面 | 5日 |
| 3-3 | AI自動ナレッジ抽出（Meet/Discord→ナレッジ候補） | 3日 |
| 3-4 | 部署別レポート画面 | 5日 |
| 3-5 | MCP Server実装 | 5日 |
| 3-6 | 部署マスタ・組織階層管理 | 3日 |
| 3-7 | データ整備が遅れている部署のKPI設計支援 | 5日 |
| 3-8 | 全社オンボーディング資料・ヘルプ拡充 | 3日 |
| 3-9 | AIエージェント（KPI未達検知→フォローアップ自動提案） | 5日 |

**Phase 3完了基準**:
- [ ] ナレッジが構造化されて全社共有される
- [ ] MCP経由でClaude/CursorからKPIデータにアクセス可能
- [ ] 全部署がKPI階層でタスク管理している
- [ ] AIエージェントがKPI未達を検知しフォローアップを提案する

---

## 8. 非機能要件

| 項目 | 要件 |
|------|------|
| パフォーマンス | KPIツリー表示: 2秒以内（100ノードまで） |
| | ダッシュボード集計: 3秒以内 |
| セキュリティ | チーム/部署スコープのデータアクセス制御 |
| | API認証はNextAuth セッションベース |
| | Discord Bot Token等の秘匿情報は環境変数管理 |
| 可用性 | 業務時間帯（9-21時）の稼働率99% |
| データ整合性 | KPI階層の整合性はサーバーサイドで常にバリデーション |
| | 孤立タスク（KPI紐付けなし）の作成を禁止 |
| 拡張性 | 新規データソース追加が容易なIngest API設計 |
| | 新規部署追加が設定のみで可能 |
| モバイル対応 | レスポンシブデザイン（タスク実行画面は特に重要） |

---

## 9. リスクと対策

| リスク | 影響 | 対策 |
|--------|------|------|
| KPI設計の質がバラつく | 階層構造が形骸化 | Phase 1でテンプレート+ガイドラインを整備。幹部レビュー必須 |
| AI提案の精度が低い | 承認負荷が増大 | 確信度閾値を調整。却下フィードバックでAI改善 |
| データ移行の混乱 | 既存Goalデータとの整合性 | Phase 1で既存データのgoal_type付与を丁寧に実施 |
| スタッフの抵抗感 | 利用率低下 | 「入力の手間を減らす」価値を先に体感させる（AI自動タスク） |
| 部署間のデータ整備格差 | 一部部署が使えない | Phase分割で段階導入。データ整備度の低い部署は後回し |

---

## 10. 成功指標

| 指標 | Phase 1目標 | Phase 3目標 |
|------|-------------|-------------|
| KPI紐付きタスク率 | 80%以上 | 95%以上 |
| 実行ログ記録率 | 50%以上 | 80%以上 |
| AI提案タスク承認率 | 40%以上 | 70%以上 |
| ナレッジ投稿数 | — | 月20件以上/部署 |
| KPI未達フォローアップ実行率 | — | 90%以上 |
| 全社導入部署数 | 2部署 | 8部署（全部署） |
