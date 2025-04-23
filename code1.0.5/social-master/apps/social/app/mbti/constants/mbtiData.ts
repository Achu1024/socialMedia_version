interface MBTITypeAnalysis {
  title: string;
  category: string;
  categoryTitle: string;
  traits: string[];
  strengths: string[];
  weaknesses: string[];
  socialTips: string[];
  careerSuggestions: string[];
}

interface MBTIAnalysisData {
  [key: string]: MBTITypeAnalysis;
}

export const mbtiAnalysis: MBTIAnalysisData = {
  ISTJ: {
    title: '检查者',
    category: 'sentinel',
    categoryTitle: '守卫者',
    traits: [
      '详尽、精确、系统、勤劳，关注细节',
      '以事实和经验做决定',
      '尊重传统和等级制度',
      '实际、有序、实事求是、负责任'
    ],
    strengths: [
      '有条理和系统性',
      '注重细节和准确性',
      '实际和现实主义',
      '可靠和负责任'
    ],
    weaknesses: [
      '因受惠于日常工作而忽视具有长远意义的目标',
      '可能忽视人际交往的细节',
      '工作方法刻板、不灵活，对变革较少开放态度',
      '期望他人和自己一样，同样注意细节和服从管理程序'
    ],
    socialTips: [
      '除了关注现实问题，需关注更深远的、定向于未来的问题',
      '需考虑人的因素，向他人表达其应得的赞赏',
      '为避免陈规，尝试寻找新的选择',
      '需培养耐心，应付那些需要用不同方式沟通或忽视规则和程序的人'
    ],
    careerSuggestions: [
      '审计师、会计、财务经理',
      '办公室行政管理',
      '后勤和供应管理',
      '公务（法律、税务）执行人员',
      '机械、电气工程师'
    ]
  },
  ISFJ: {
    title: '保护者',
    category: 'sentinel',
    categoryTitle: '守卫者',
    traits: [
      '仁慈、忠诚、体谅他人、善良',
      '不怕麻烦帮助需要帮助的人',
      '做事有条理、精确和细心',
      '在稳定的环境中工作最出色'
    ],
    strengths: [
      '考虑组织中每个人的实际需要',
      '对细节和日常惯例非常耐心',
      '责任感强',
      '做事力求完美'
    ],
    weaknesses: [
      '过于谨慎小心，尤其是对待未来发展',
      '向他人表明自己观点时，显得意志不太坚定',
      '因安静、忘却自我的特性而低估自己',
      '过度依赖自己的经验，不能根据环境和其它需要灵活调整'
    ],
    socialTips: [
      '工作中需要估计风险，以积极、全面的观点看待未来',
      '需发展更多的自信和直率',
      '学会宣扬自己的成就',
      '对其它形式的做事方式需保持开放态度'
    ],
    careerSuggestions: [
      '行政管理人员',
      '总经理助理',
      '人事管理者',
      '外科医生及其它各类医生',
      '护士、药剂师'
    ]
  },
  // ... 其他MBTI类型数据 ...
};

export const categoryColors = {
  analyst: 'bg-blue-100 text-blue-800',
  diplomat: 'bg-green-100 text-green-800',
  sentinel: 'bg-purple-100 text-purple-800',
  explorer: 'bg-orange-100 text-orange-800'
}; 