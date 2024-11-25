import AppMenubar from "../menubar";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AppMenubar />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">使用注意事項</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              <div className="flex items-center">
                <div className="w-1 h-6 flex items-center justify-center rounded-sm bg-blue-100 text-blue-600 mr-2">1</div>
                <span>基本規則</span>
                <div className="h-1 flex-grow ml-2 bg-blue-100"></div>
              </div>
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                每人每天限登記／預約三格時段，並填志願序
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                每個時段可登記 1-4 人使用（優先序 4 ＞ 2 ＞ 3 ＞ 1）
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                請於預約時間前 10 分鐘到場
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                如無法準時到場，請提前 30 分鐘取消預約
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              <div className="flex items-center">
                <div className="w-1 h-6 flex items-center justify-center rounded-sm bg-green-100 text-green-600 mr-2">2</div>
                <span>抽籤規則</span>
                <div className="h-1 flex-grow ml-2 bg-green-100"></div>
              </div>
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                每天早上 10:00 開放下週同一天場地預約
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                每天早上 9:00 ~ 10:00 截止預約，進行抽籤
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                抽籤結果以 Email 通知隊長
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              <div className="flex items-center">
                <div className="w-1 h-6 flex items-center justify-center rounded-sm bg-purple-100 text-purple-600 mr-2">3</div>
                <span>候補規則</span>
                <div className="h-1 flex-grow ml-2 bg-purple-100"></div>
              </div>
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                可登記候補，每個時段限額 4 組
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                若有空位釋出，系統將自動通知候補隊伍的隊長
              </li>
            </ul>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">
              <div className="flex items-center">
                <div className="w-1 h-6 flex items-center justify-center rounded-sm bg-red-100 text-red-600 mr-2">4</div>
                <span>停權規則</span>
                <div className="h-1 flex-grow ml-2 bg-red-100"></div>
              </div>
            </h2>
            <ul className="space-y-3 text-gray-700">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                無故未到將停權 7 天
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                一個月內兩次未到，停權 30 天
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                遲到超過 15 分鐘視同未到
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                遲遲兩次未確認候補通知，當月不得再登記候補
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}