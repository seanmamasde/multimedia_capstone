import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import AppMenubar from '../components/menubar';
import './page.css';

export default function Home() {
  const rules = [
    {
      title: '基本規則',
      color: 'blue',
      number: 1,
      items: [
        '每人每天限登記／預約三格時段',
        '每個時段可預約 1~4 人使用（抽籤優先序 4＞2＞3＞1）',
        '請於登記時間前 10 分鐘到場',
        '如無法準時到場，請提前 30 分鐘取消登記',
      ],
    },
    {
      title: '抽籤規則',
      color: 'green',
      number: 2,
      items: [
        '每天凌晨 12:00 開放下週同一天場地預約',
        '每天晚上 11:00 ~ 12:00 停止預約，進行抽籤',
        '抽籤結果以 Email 通知隊長',
      ],
    },
    {
      title: '候補規則',
      color: 'purple',
      number: 3,
      items: [
        '可登記候補，每個時段限額 5 組',
        '若有空位釋出，系統將自動通知候補隊伍的隊長',
      ],
    },
    {
      title: '停權規則',
      color: 'red',
      number: 4,
      items: [
        '無故未到將停權 7 天',
        '一個月內兩次未到，停權 30 天',
        '遲到超過 15 分鐘視同未到',
        '兩次未確認候補通知，當月不得再登記候補',
      ],
    },
  ];

  return (
    <div className="home-container">
      <AppMenubar />
      <div className="content-wrapper">
        <h1 className="title">使用注意事項</h1>
        <div className="rules-grid">
          {rules.map((rule) => (
            <Card
              key={rule.number}
              className={`rule-card border-${rule.color}-500`}
              title={
                <div className="rule-header">
                  <div className={`rule-number bg-${rule.color}-100 text-${rule.color}-600`}>
                    {rule.number}
                  </div>
                  <span className="rule-title">{rule.title}</span>
                </div>
              }
            >
              <Divider />
              <ul className="rule-items">
                {rule.items.map((item, idx) => (
                  <li key={idx} className="rule-item">
                    <span className="bullet">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
