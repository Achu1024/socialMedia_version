'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { withAuth } from '@/container/auth-contanier/AuthContainer';
import { useProfile } from '@/http/useAuth';
import { useSaveMBTI, useMBTIStatistics } from '@/http/useMibt';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MBTITest, { MBTIResult } from '../../container/mibt-contanier/MBTITest';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

// 定义饼图的颜色
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

// MBTI类型描述和建议
const mbtiAnalysis = {
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
  INFJ: {
    title: '提倡者',
    category: 'diplomat',
    categoryTitle: '外交家',
    traits: [
      '相信自己的眼光，具有同情心和洞察力',
      '温和地运用影响力',
      '提供服务于人类需要的远见卓识',
      '恪守职责'
    ],
    strengths: [
      '完善、始终如一地工作',
      '找个感到静谧的时间段以集中精力提出具有创造性的观点',
      '在人与工作间建立复杂的相互作用关系',
      '意志坚定地激发他人实现他们的理想'
    ],
    weaknesses: [
      '发现自己的远见被忽视和低估',
      '面对批评不太坦率',
      '因不太愿强迫别人而过度保守',
      '仅从单一维度考虑他们认为对将来最有益的事'
    ],
    socialTips: [
      '在提出自己的观点时，需发展政治领悟力和自主性的技策',
      '需学会及时给他人建设性的反馈',
      '需要不断征求他人的建议和获得他人反馈',
      '需要以更放松和开放的态度面对现状'
    ],
    careerSuggestions: [
      '心理咨询工作者',
      '心理诊疗师',
      '职业指导顾问',
      '大学教师（人文学科、艺术类）',
      '作家、诗人、剧作家'
    ]
  },
  INTJ: {
    title: '建筑师',
    category: 'analyst',
    categoryTitle: '分析家',
    traits: [
      '独立而极具个性化',
      '具有专一性和果断性',
      '相信自己的眼光，漠视众人的怀疑',
      '喜欢独自完成复杂的工程'
    ],
    strengths: [
      '为组织提供理论观点和设计技术',
      '把想法变成行动计划',
      '为达成目标排除障碍',
      '促使组织中的每个人明白组织是由许多复杂、相互作用的部分组成的整体系统'
    ],
    weaknesses: [
      '可能显得强硬，他人不敢接近',
      '长时间不告诉他人自己的想法',
      '可能很难实际操作理想化的想法',
      '过度关注任务而忽视他人的贡献'
    ],
    socialTips: [
      '自己的个性化方式和想法可以征求他人的反馈和建议',
      '与参与任务的人早一些沟通和讨论自己的想法和战略计划',
      '当事实资料不支持自己的想法时，应面对现实',
      '明确他人的贡献应受到鼓励和承认的'
    ],
    careerSuggestions: [
      '各类科学家、研究所研究人员',
      '设计工程师、系统分析员',
      '计算机程序师、研究开发部经理',
      '投资专家、法律顾问',
      '经济学家、投资银行研究员'
    ]
  },
  INTP: {
    title: '逻辑学家',
    category: 'analyst',
    categoryTitle: '分析家',
    traits: [
      '讲究合理性，喜欢理论和抽象的事物',
      '好奇心重，更喜欢构建思想',
      '不太关注环境和人',
      '喜欢单独工作，强调对自己的观点和方法拥有最大的自主权'
    ],
    strengths: [
      '为组织设计理性、复杂的系统',
      '在处理错综复杂的问题中显示出其专业性',
      '同时拥有理智的短期和长期目标',
      '提供理智的、分析的、批评的思维方式'
    ],
    weaknesses: [
      '过于抽象，因而坚持下去不太符合现实需要',
      '过于理性化，解释起来太理论化',
      '过多注意团队中一些小的不一致的地方',
      '可能以批评式分析方式待人，行动不考虑个体感受'
    ],
    socialTips: [
      '需要关注现实中的细节，确立完成任务的具体步骤',
      '需要简单地陈述事实',
      '为获得他人的合作，需要放弃细小的问题',
      '需要更好地认识他人，更多地表达对他人的赞赏'
    ],
    careerSuggestions: [
      '软件设计员、系统分析师',
      '计算机程序员、数据库管理',
      '大学教授、科研机构研究人员',
      '数学家、物理学家、经济学家',
      '证券分析师、金融投资顾问'
    ]
  },
  ENTJ: {
    title: '指挥官',
    category: 'analyst',
    categoryTitle: '分析家',
    traits: [
      '具有逻辑性、组织性、客观性、果断性',
      '喜欢与他人一起工作',
      '尤其从事管理工作和制定战略计划',
      '富于活力的行为定向型领导'
    ],
    strengths: [
      '制定经过深思熟虑的组织计划',
      '为组织建立组织结构',
      '制定有远大目标的战略规划',
      '快速管理，迅速解决需要解决的问题'
    ],
    weaknesses: [
      '关注任务而忽视人们的需要和对组织的贡献',
      '忽略现实的考虑和对现实局限性的认识',
      '决策太迅速，表现得缺乏耐心，盛气凌人',
      '忽视和抑制自己和他人的情感'
    ],
    socialTips: [
      '需要考虑人的因素，赞赏他人对组织的贡献',
      '行动前先检查现实的、人力的、环境的资源是否可获得',
      '决策前花些时间考虑和反思各个方面的因素',
      '需要学会鉴别和重视自己和他人的情感'
    ],
    careerSuggestions: [
      '各类企业的高级主管、总经理',
      '企业主、社会团体负责人',
      '投资银行家、风险投资家',
      '企业管理顾问、企业战略顾问',
      '律师、法官、知识产权专家'
    ]
  },
  ENTP: {
    title: '辩论家',
    category: 'analyst',
    categoryTitle: '分析家',
    traits: [
      '富于创新，具有战略眼光',
      '多才多艺，分析型思维',
      '具有创业能力',
      '喜欢与他人一起从事需要非凡智慧的创始性活动'
    ],
    strengths: [
      '把限制看作是挑战加以排除',
      '提供完成任务的新方法',
      '把问题放在理论框架中进行考虑',
      '提倡创新，激励他人创新'
    ],
    weaknesses: [
      '过多依赖模型而忘记现实状况',
      '因竞争心而不会赞赏他人的付出',
      '因过分扩展自己而筋疲力尽',
      '可能抵制正规的程序和准则'
    ],
    socialTips: [
      '需要注意各个方面的因素和基本的事实',
      '需要承认他人贡献的有效性',
      '需要设立现实性的开始与结束的期限，知道何时该结束',
      '需要学会怎样在组织里如何工作'
    ],
    careerSuggestions: [
      '投资顾问、项目策划',
      '投资银行家、风险投资人',
      '市场营销人员、广告创意',
      '艺术总监、访谈类节目主持人',
      '公共关系专家、政治家'
    ]
  },
  INFP: {
    title: '调停者',
    category: 'diplomat',
    categoryTitle: '外交家',
    traits: [
      '具有开放性，是理想主义者',
      '具有洞察力，灵活',
      '希望自己的工作被认为是重要的',
      '喜欢独立工作或在能发挥创造性的小团体里工作'
    ],
    strengths: [
      '以自己的理想与他人沟通和说服他人',
      '用组织共同的目标把人们团结起来',
      '致力于为组织中的人们寻求匹配的岗位',
      '为组织提供新的理念和各种发展的可能性'
    ],
    weaknesses: [
      '因完美倾向而延误完成任务',
      '一次行为想令太多人满意',
      '没有调整理想适合客观现实',
      '思考多于行动'
    ],
    socialTips: [
      '需要学会怎样工作而不是只注意寻求理想的反应',
      '需要发展更坚强的意志，并愿意说"不"',
      '需要用自己的准则分清事实和逻辑',
      '需要建立和执行行动计划'
    ],
    careerSuggestions: [
      '各类艺术家、插图画家',
      '诗人、小说家、建筑师',
      '大学老师（人文类）',
      '心理学工作者、心理辅导',
      '社会工作者、教育顾问'
    ]
  },
  ENFP: {
    title: '探险家',
    category: 'diplomat',
    categoryTitle: '外交家',
    traits: [
      '热情，富有洞察力和创新性',
      '多才多艺，不知疲倦地寻求新的希望和前景',
      '喜欢在团队中工作',
      '致力于从事能给人们带来更好的改变的事情'
    ],
    strengths: [
      '能察觉改革的需要并发起变革',
      '关注前景的发展，尤其是人们的未来发展',
      '以富有感染力的热情激励和说服他人',
      '把创造性和想象性体现在制定的计划和贯彻的行为中'
    ],
    weaknesses: [
      '在没完成已经提出的计划之前又转移到新的想法和计划上',
      '忽视相关的细节和事实资料',
      '过分扩展，尝试做的事情太多',
      '因寻求可能的最佳结果而拖延工作'
    ],
    socialTips: [
      '需要根据重要性事先做好安排，先做最重要的，坚持到底',
      '需要关注重要的细节',
      '需要学会筛选任务，不要试图去做所有具有吸引力的任务',
      '为达成目标，需使用制定计划和进行时间管理的技巧'
    ],
    careerSuggestions: [
      '广告创意、广告撰稿人',
      '市场营销和宣传策划',
      '儿童教育老师、培训师',
      '心理学工作者、职业规划顾问',
      '记者、节目策划和主持人'
    ]
  },
  ENFJ: {
    title: '主人公',
    category: 'diplomat',
    categoryTitle: '外交家',
    traits: [
      '关注人际关系，理解、宽容和赞赏他人',
      '是良好沟通的促进者',
      '喜欢与他人一起工作',
      '致力于完成与人们的发展有关的各种任务'
    ],
    strengths: [
      '有强烈的关于组织该如何对待人们的观念',
      '喜欢领导和促进团队的建立',
      '鼓励合作',
      '传播组织的价值观和准则'
    ],
    weaknesses: [
      '可能会理想化他人，因而遭受他人表面忠诚的蒙蔽',
      '可能回避有冲突的问题',
      '因重视人际关系而忽视任务',
      '过度自我批评'
    ],
    socialTips: [
      '需要认识人们的局限性，捍卫真正的忠诚',
      '需要学会建设性地处理冲突',
      '需要学会同时关注任务中的细节问题和完成任务的人',
      '需要认真听取客观的评价，少一些自我批评'
    ],
    careerSuggestions: [
      '人力资源培训主任',
      '销售、沟通、团队培训员',
      '职业指导顾问、心理咨询工作者',
      '大学教师（人文学科类）',
      '记者、公共关系专家'
    ]
  },
  ISTP: {
    title: '鉴赏家',
    category: 'explorer',
    categoryTitle: '探险家',
    traits: [
      '注重实用性，尊重事实',
      '寻求有利方法，具有现实性',
      '只信服被论证的结果',
      '喜欢独立工作，依靠逻辑和足智多谋解决即时出现的组织问题'
    ],
    strengths: [
      '在需要的场合，是解决麻烦问题的能手',
      '在感兴趣的领域里，发挥行走的信息库的作用',
      '计算出克服障碍、完成任务的最实际的途径',
      '在危机中保持镇定，发挥安抚他人情绪的作用'
    ],
    weaknesses: [
      '只关注对自身重要的事而对其它事漠不关心',
      '在先前的努力获得成果前，缺少坚持性',
      '努力不足，过度注重有利性而走捷径',
      '犹豫不决，欠缺兴趣、活力、坚持性'
    ],
    socialTips: [
      '需要增强开放性，关心他人，与他人共享信息',
      '需发展坚持性，改变沟通模式',
      '加强计划性，付出更多努力获取想要的成功',
      '需发展设置和保持目标的方法'
    ],
    careerSuggestions: [
      '机械、电气、电子工程师',
      '各类技术专家和技师',
      '计算机硬件、系统集成专业人员',
      '证券分析师、金融顾问',
      '警察、侦探、体育工作者'
    ]
  },
  ISFP: {
    title: '探索者',
    category: 'explorer',
    categoryTitle: '探险家',
    traits: [
      '温和、体贴、灵活、具有开放性',
      '富有同情心，尤其对那些需要帮助的人',
      '喜欢在合作和充满和谐气氛的环境中工作',
      '常常是在完成他们自己任务的时候'
    ],
    strengths: [
      '对组织中每个人的需要都做出反应',
      '以实际行动保证他人获得福利',
      '对自己的工作投进特别的热情和愉悦',
      '因具有合作的天性，把人与任务很好地匹配起来'
    ],
    weaknesses: [
      '可能太信任他人，不愿持怀疑态度',
      '为避免冲突而不批评他人',
      '只关注眼前的损失',
      '过度自我批评，容易受伤害'
    ],
    socialTips: [
      '需发展以怀疑的态度分析他人提供的信息',
      '需学会给他人负面反馈，处理好冲突',
      '需发展更广阔、更朝向未来定向的观念',
      '需对他人更果断，对自己有更多赞赏'
    ],
    careerSuggestions: [
      '时装、首饰设计师',
      '装潢、园艺设计师',
      '出诊医生、出诊护士',
      '理疗师、牙科医生',
      '餐饮业、娱乐业业主'
    ]
  },
  ESTP: {
    title: '企业家',
    category: 'explorer',
    categoryTitle: '探险家',
    traits: [
      '行为定向型，讲究实效',
      '足智多谋、注重现实',
      '以最有效的途径解决问题',
      '喜欢事件即时发生，然后在复杂的情境中找到解决问题的方法'
    ],
    strengths: [
      '采用协商的方式使任务顺利完成',
      '保持组织运作的活跃状态，促使变化发生',
      '运用直接和现实的工作方式',
      '评估风险'
    ],
    weaknesses: [
      '当快速行为时，显得苛求、强硬、感觉迟钝',
      '过分集中于即时行为，而失去行为的更广阔、深远的意义',
      '转移到下一个待解决问题而不能坚持解决目前的问题',
      '会被工作以外的活动吸引，如体育运动和其它娱乐活动'
    ],
    socialTips: [
      '需抑制自己的任务型定向，分析他人的情绪感受',
      '需在快速决定之前，事先计划，考虑更多的因素',
      '需完成眼前的任务',
      '需以适当的观点看待工作和娱乐'
    ],
    careerSuggestions: [
      '各类贸易商、批发商',
      '中间商、零售商',
      '房地产经纪人',
      '保险经济人',
      '股票经纪人、证券分析师'
    ]
  },
  ESFP: {
    title: '表演者',
    category: 'explorer',
    categoryTitle: '探险家',
    traits: [
      '友好、开朗，爱开玩笑，活泼',
      '天性喜欢与他人相处',
      '喜欢与其他活泼、快节奏的人一起工作',
      '同时也会根据判断做出不同选择'
    ],
    strengths: [
      '为组织创造具有活力、热情、合作的氛围',
      '为组织提供积极发展的规划',
      '具有行动力，营造热情、轻松的气氛',
      '协调人、信息、资源的关系'
    ],
    weaknesses: [
      '为保持和谐，过度强调主观性论据',
      '行动前不太考虑眼前的事实',
      '可能花太多的时间在社会关系上而忽视任务本身',
      '常常有始无终'
    ],
    socialTips: [
      '为减少非个体性冲突，做决策时需理智分析决策的意义',
      '进行管理工作前应事先制定计划',
      '需平衡花费在任务和社会性交往上的时间',
      '需致力于完成计划，对时间进行管理'
    ],
    careerSuggestions: [
      '精品店、商场销售人员',
      '娱乐、餐饮业客户经理',
      '广告企业中的设计师',
      '创意人员、客户经理',
      '节目主持人、脱口秀演员'
    ]
  },
  ESFJ: {
    title: '执政官',
    category: 'sentinel',
    categoryTitle: '守卫者',
    traits: [
      '乐于助人，机智，富有同情心',
      '注重秩序，把与他人相处和谐看得很重要',
      '喜欢组织人们和制定计划完成眼前的任务',
      '服务型定向'
    ],
    strengths: [
      '密切关注组织中每个人的需要，并使他们满意',
      '以及时、精确的工作方式完成任务',
      '尊重规则和权威',
      '有效处理日常管理任务'
    ],
    weaknesses: [
      '避免和回避冲突',
      '因致力于令他人满意而忽略自己',
      '提供自己认为是对组织和对他人最好的建议',
      '不经常有时间客观地反思过去、展想未来'
    ],
    socialTips: [
      '需学会注意差异性和处理冲突',
      '需学会分离出自己的需要',
      '需学会更客观地听取真正需要什么',
      '做决策时，需考虑决策的理性、全局性的意义'
    ],
    careerSuggestions: [
      '办公室行政或管理人员',
      '秘书、总经理助理',
      '内科医生及其它各类医生',
      '小学教师（班主任）',
      '银行、酒店客户服务代表'
    ]
  },
  ESTJ: {
    title: '总经理',
    category: 'sentinel',
    categoryTitle: '守卫者',
    traits: [
      '理智、善分析、果断、意志坚定',
      '以系统化的方式组织具体事实',
      '喜欢事先组织细节和操作程序',
      '与他人一起完成任务'
    ],
    strengths: [
      '事先察觉、指出、修正不足之处',
      '以逻辑的、客观的方式评论规划',
      '组织规划、生产、人力要素，实现组织目标',
      '监督工作以确保任务正确完成'
    ],
    weaknesses: [
      '决策太迅速，也给他人施以同样的压力',
      '不能察觉变革的需要，因为相信一切都在正常运作',
      '在完成任务过程中，忽视人际间的小细节',
      '长期忽视自己的感受和准则，可能会被自己的情感击跨'
    ],
    socialTips: [
      '决策之前需考虑各种因素，包括人的因素',
      '需要促使自己看到他人要求变革而获得的利益',
      '需做特别的努力学会赞赏别人',
      '需从工作中抽点时间考虑和识别自己的情感和价值观'
    ],
    careerSuggestions: [
      '大、中型外资企业员工',
      '业务经理、中层经理',
      '职业经理人',
      '各类中小型企业主管',
      '项目管理、工厂管理'
    ]
  }
};

const categoryColors = {
  analyst: 'bg-blue-100 text-blue-800',
  diplomat: 'bg-green-100 text-green-800',
  sentinel: 'bg-purple-100 text-purple-800',
  explorer: 'bg-orange-100 text-orange-800'
};

const MBTIPage = () => {
  const [testCompleted, setTestCompleted] = useState(false);
  const [result, setResult] = useState<MBTIResult | null>(null);
  const [showTest, setShowTest] = useState(false);
  const { data: user, isLoading } = useProfile();
  const { mutate: saveMBTI, isPending: isSaving } = useSaveMBTI();
  const { data: statistics, isLoading: isLoadingStats } = useMBTIStatistics();
  const queryClient = useQueryClient();
  // 从接口数据中获取MBTI测试结果
  useEffect(() => {
    if (user && user.mbti_result) {
      // 如果接口中有用户的MBTI结果
      setResult(user.mbti_result);
      setTestCompleted(true);
    } else {
      // 如果接口没有结果，检查本地存储
      const savedResults = localStorage.getItem('mbti_results');
      if (savedResults) {
        setResult(JSON.parse(savedResults));
        setTestCompleted(true);
      }
    }
  }, [user]);

  const handleTestComplete = (testResult: MBTIResult) => {
    setResult(testResult);
    setTestCompleted(true);

    // 保存测试结果到服务器
    saveMBTI(testResult, {
      onSuccess: () => {
        toast.success('测试结果保存成功');
        queryClient.invalidateQueries({ queryKey: ['profile'] });
      },
    });
  };

  const startNewTest = () => {
    // 清除旧结果
    localStorage.removeItem('mbti_answers');
    localStorage.removeItem('mbti_current_question');
    localStorage.removeItem('mbti_results');
    setResult(null);
    setTestCompleted(false);
    setShowTest(true);
  };

  const renderListView = () => (
    <div className="grid grid-cols-2 gap-4">
      {statistics?.map((item) => (
        <div
          key={item.type}
          className="flex items-center justify-between p-4 rounded-lg bg-gray-50"
        >
          <span className="font-medium">{item.type}</span>
          <span className="text-gray-600">{item.count} 人</span>
        </div>
      ))}
    </div>
  );

  const renderPieChart = () => (
    <div className='h-[400px]'>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={statistics}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ type, count }) => `${type}: ${count}人`}
            innerRadius={60}
            outerRadius={120}
            fill="#8884d8"
            dataKey="count"
            nameKey="type"
          >
            {statistics?.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );

  const renderScoreComparison = (
    label1: string,
    score1: number,
    label2: string,
    score2: number,
    shortLabel1: string,
    shortLabel2: string
  ) => {
    const total = score1 + score2;
    const isFirstHigher = score1 > score2;
    const percentage = isFirstHigher ? (score1 / total) * 100 : (score2 / total) * 100;
    
    return (
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <p className="text-sm font-medium">{label1} ({shortLabel1}) vs {label2} ({shortLabel2})</p>
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>{score1}</span>
          <span>{score2}</span>
        </div>
        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="absolute h-full bg-emerald-600 rounded-full transition-all"
            style={{ 
              width: `${percentage}%`,
              left: isFirstHigher ? '0' : 'auto',
              right: isFirstHigher ? 'auto' : '0'
            }}
          />
        </div>
      </div>
    );
  };

  const renderPersonalityAnalysis = (personalityType: string) => {
    const analysis = mbtiAnalysis[personalityType as keyof typeof mbtiAnalysis];
    
    if (!analysis) {
      return (
        <div className="space-y-4">
          <p className="text-gray-500 italic">暂无该类型的详细分析</p>
        </div>
      );
    }

    return (
      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-6">
          <div className="text-center">
            <Badge 
              className={`${categoryColors[analysis.category as keyof typeof categoryColors]} text-sm px-3 py-1`}
            >
              {analysis.categoryTitle}类型
            </Badge>
          </div>

          <Tabs defaultValue="traits" className="w-full">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="traits">性格特征</TabsTrigger>
              <TabsTrigger value="strengths">优势劣势</TabsTrigger>
              <TabsTrigger value="social">社交建议</TabsTrigger>
              <TabsTrigger value="career">职业建议</TabsTrigger>
            </TabsList>
            
            <TabsContent value="traits" className="mt-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg mb-3">核心特征</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {analysis.traits.map((trait, index) => (
                    <li key={index} className="leading-relaxed">{trait}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="strengths" className="mt-4 space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg mb-3">主要优势</h3>
                <ul className="list-disc list-inside space-y-2 text-emerald-600">
                  {analysis.strengths.map((strength, index) => (
                    <li key={index} className="leading-relaxed">{strength}</li>
                  ))}
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-lg mb-3">潜在挑战</h3>
                <ul className="list-disc list-inside space-y-2 text-rose-600">
                  {analysis.weaknesses.map((weakness, index) => (
                    <li key={index} className="leading-relaxed">{weakness}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="social" className="mt-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg mb-3">社交发展建议</h3>
                <ul className="list-disc list-inside space-y-2 text-gray-600">
                  {analysis.socialTips.map((tip, index) => (
                    <li key={index} className="leading-relaxed">{tip}</li>
                  ))}
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="career" className="mt-4">
              <div className="space-y-2">
                <h3 className="font-semibold text-lg mb-3">适合的职业方向</h3>
                <div className="grid grid-cols-2 gap-3">
                  {analysis.careerSuggestions.map((career, index) => (
                    <div 
                      key={index}
                      className="p-3 bg-gray-50 rounded-lg text-gray-700 text-sm"
                    >
                      {career}
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    );
  };

  if (isLoading) {
    return (
      <div className='flex justify-center py-8'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='container mx-auto py-8 px-4'>
      <div className='grid grid-cols-5 gap-6 max-w-7xl mx-auto'>
        {/* MBTI测试结果卡片 - 占3列 */}
        <Card className='h-[700px] col-span-3 pt-50'>
          {testCompleted && result ? (
            <>
              <CardHeader className="text-center pb-2 mt-[-80px]">
                <CardTitle className="text-2xl">您的MBTI测试结果</CardTitle>
                <CardDescription className="text-lg mt-2 mb-2">
                  您的人格类型是：
                  <span className="font-semibold text-primary">{result.personality_type}</span>
                  {mbtiAnalysis[result.personality_type as keyof typeof mbtiAnalysis]?.title && (
                    <span className="ml-2 text-gray-500">
                      ({mbtiAnalysis[result.personality_type as keyof typeof mbtiAnalysis].title})
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="overflow-y-auto h-[calc(100%-200px)]">
                <div className='space-y-6'>
                  {/* 分数对比部分 */}
                  <div className="space-y-6">
                    {renderScoreComparison(
                      '内向', 
                      result.introversion_score,
                      '外向',
                      result.extroversion_score,
                      'I',
                      'E'
                    )}
                    {renderScoreComparison(
                      '直觉',
                      result.intuition_score,
                      '感知',
                      result.sensing_score,
                      'N',
                      'S'
                    )}
                    {renderScoreComparison(
                      '思考',
                      result.thinking_score,
                      '情感',
                      result.feeling_score,
                      'T',
                      'F'
                    )}
                    {renderScoreComparison(
                      '判断',
                      result.judging_score,
                      '感知',
                      result.perceiving_score,
                      'J',
                      'P'
                    )}
                  </div>
                  
                  {/* 性格分析和建议部分 */}
                  <div className="mt-8 pt-6 border-t">
                    <h2 className="text-xl font-semibold mb-4 text-center">个性分析与发展建议</h2>
                    {renderPersonalityAnalysis(result.personality_type)}
                  </div>
                </div>
              </CardContent>
              <CardFooter className='mt-auto'>
                <div className='flex flex-col gap-2 w-full'>
                  <Button 
                    onClick={startNewTest} 
                    className='w-full bg-primary hover:bg-primary/90'
                  >
                    重新测试
                  </Button>
                  {/* {!user?.mbti_result && (
                    <Button
                      onClick={() =>
                        saveMBTI(result, {
                          onSuccess: () => toast.success('测试结果保存成功'),
                        })
                      }
                      disabled={isSaving}
                      variant='outline'
                      className='w-full'
                    >
                      {isSaving ? (
                        <>
                          <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                          保存中...
                        </>
                      ) : (
                        '保存结果'
                      )}
                    </Button>
                  )} */}
                </div>
              </CardFooter>
            </>
          ) : showTest ? (
            <MBTITest onComplete={handleTestComplete} />
          ) : (
            <>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl">开始MBTI测试</CardTitle>
                <CardDescription className="text-lg mt-2">
                  测试包含93个问题，大约需要15-20分钟完成
                </CardDescription>
              </CardHeader>
              <CardFooter className='flex justify-center pt-6'>
                <Button 
                  onClick={startNewTest} 
                  size='lg'
                  className="bg-primary hover:bg-primary/90 px-8"
                >
                  开始测试
                </Button>
              </CardFooter>
            </>
          )}
        </Card>

        {/* MBTI类型分布统计卡片 */}
        <Card className='h-[600px] col-span-2'>
          <CardHeader>
            <CardTitle>MBTI类型分布统计</CardTitle>
            <CardDescription>所有用户的MBTI类型分布情况</CardDescription>
          </CardHeader>
          <CardContent className="overflow-y-auto h-[calc(100%-180px)]">
            {isLoadingStats ? (
              <div className='flex justify-center py-8'>
                <Loader2 className='h-8 w-8 animate-spin text-primary' />
              </div>
            ) : statistics ? (
              <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="list">列表视图</TabsTrigger>
                  <TabsTrigger value="pie">图表视图</TabsTrigger>
                </TabsList>
                <TabsContent value="list" className="mt-6">
                  {renderListView()}
                </TabsContent>
                <TabsContent value="pie">
                  {renderPieChart()}
                </TabsContent>
              </Tabs>
            ) : (
              <p className='text-center text-gray-500'>暂无统计数据</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// 使用 withAuth 高阶组件包装页面组件
export default withAuth(MBTIPage);
