const { connectDatabase, disconnectDatabase } = require('../config/database');
const {
    TheoryContent,
    TrainingContentShared,
    TrainingContentSpecific,
    PracticalVideo,
    QuestionBank,
    User,
} = require('../models');

const makeMcq = (text, options, correctKey, explanation = '') => ({
    text,
    type: 'mcq',
    options,
    correctAnswer: correctKey,
    explanation,
    status: 'active',
});

const SAMPLE_QUESTIONS = [
    makeMcq(
        'ما معنى الإشارة الضوئية الحمراء؟',
        [
            { key: 'A', text: 'توقف تام' },
            { key: 'B', text: 'تسريع' },
            { key: 'C', text: 'انعطاف يسار' },
            { key: 'D', text: 'متابعة السير' },
        ],
        'A',
        'الأحمر يعني توقفاً تاماً وعدم تجاوز خط التوقف.',
    ),
    makeMcq(
        'ما المسافة الآمنة بين مركبتين على الطريق السريع؟',
        [
            { key: 'A', text: 'متر واحد' },
            { key: 'B', text: '3 ثوانٍ على الأقل' },
            { key: 'C', text: '50 سم' },
            { key: 'D', text: 'لا توجد مسافة' },
        ],
        'B',
        'قاعدة الثواني الثلاث تمنحك وقتاً للتفاعل عند الفرملة المفاجئة.',
    ),
    makeMcq(
        'متى يجب استخدام أضواء الطوارئ (الفلاش)؟',
        [
            { key: 'A', text: 'عند الركن فقط' },
            { key: 'B', text: 'في الضباب الكثيف' },
            { key: 'C', text: 'دائماً ليلاً' },
            { key: 'D', text: 'عند تجاوز السرعة' },
        ],
        'B',
        'تُستخدم للتنبيه عند رؤية ضعيفة أو توقف طارئ يهدد السلامة.',
    ),
    makeMcq(
        'ما السرعة القصوى المسموحة داخل المدن عادةً؟',
        [
            { key: 'A', text: '40 كم/س' },
            { key: 'B', text: '60 كم/س' },
            { key: 'C', text: '100 كم/س' },
            { key: 'D', text: '120 كم/س' },
        ],
        'B',
        'السرعة داخل التجمعات السكنية أقل لحماية المشاة.',
    ),
    makeMcq(
        'من له الأولوية عند تقاطع بدون إشارات؟',
        [
            { key: 'A', text: 'القادم من اليمين' },
            { key: 'B', text: 'الأسرع دائماً' },
            { key: 'C', text: 'الأكبر حجماً' },
            { key: 'D', text: 'القادم من اليسار' },
        ],
        'A',
        'قاعدة اليمين تُطبّق عند غياب الإشارات والعلامات.',
    ),
];

const BANK_QUESTIONS = [
    ...SAMPLE_QUESTIONS,
    makeMcq(
        'ماذا تعني العلامة المثلثة ذات الحافة الحمراء؟',
        [
            { key: 'A', text: 'إلزام' },
            { key: 'B', text: 'تحذير' },
            { key: 'C', text: 'معلومات' },
            { key: 'D', text: 'منع' },
        ],
        'B',
        'المثلثات التحذيرية تُنبّه لخطر محتمل.',
    ),
    makeMcq(
        'قبل الانعطاف يجب:',
        [
            { key: 'A', text: 'الإشارة مبكراً والتحقق من المرايا' },
            { key: 'B', text: 'الفرملة المفاجئة فقط' },
            { key: 'C', text: 'تجاوز المركبة الأمامية' },
            { key: 'D', text: 'إطفاء الأنوار' },
        ],
        'A',
        'الإشارة والمرايا والنقطة العمياء خطوات أساسية قبل تغيير الاتجاه.',
    ),
    makeMcq(
        'حزام الأمان إلزامي لـ:',
        [
            { key: 'A', text: 'السائق فقط' },
            { key: 'B', text: 'الركاب الأماميين فقط' },
            { key: 'C', text: 'جميع الركاب' },
            { key: 'D', text: 'لا أحد' },
        ],
        'C',
        'حزام الأمان يحمي الجميع ويقلل إصابات الحوادث.',
    ),
    makeMcq(
        'عند رؤية مشاة على ممر الراجلين يجب:',
        [
            { key: 'A', text: 'التخفيف والتوقف عند الحاجة' },
            { key: 'B', text: 'الإنذار المستمر' },
            { key: 'C', text: 'التجاوز بسرعة' },
            { key: 'D', text: 'تجاهلهم' },
        ],
        'A',
        'للمشاة أولوية على الممرات المخصصة.',
    ),
    makeMcq(
        'القيادة تحت تأثير الكحول:',
        [
            { key: 'A', text: 'مسموحة بكميات قليلة' },
            { key: 'B', text: 'محظورة وخطيرة' },
            { key: 'C', text: 'مسموحة ليلاً فقط' },
            { key: 'D', text: 'لا تؤثر على رد الفعل' },
        ],
        'B',
        'الكحول يبطئ ردود الفعل ويزيد احتمال الحوادث.',
    ),
];

const contentSeed = async ({ schoolId, managerId } = {}) => {
    await connectDatabase();

    await TheoryContent.findOneAndUpdate(
        { categoryCode: 'B', isSample: true, sampleTier: 'partial' },
        {
            categoryCode: 'B',
            phase: 0,
            title: 'عينة مجانية — نظري',
            body: 'أسئلة تفاعلية للزوار قبل التسجيل الكامل.',
            order: 0,
            isSample: true,
            sampleTier: 'partial',
            interactiveQuestions: SAMPLE_QUESTIONS.slice(0, 3),
            isActive: true,
        },
        { upsert: true, new: true },
    );

    await TheoryContent.findOneAndUpdate(
        { categoryCode: 'B', isSample: true, sampleTier: 'full' },
        {
            categoryCode: 'B',
            phase: 0,
            title: 'عينة كاملة — نظري',
            body: 'أسئلة إضافية للمستخدمين المسجّلين.',
            order: 1,
            isSample: true,
            sampleTier: 'full',
            interactiveQuestions: SAMPLE_QUESTIONS,
            isActive: true,
        },
        { upsert: true, new: true },
    );

    await TheoryContent.findOneAndUpdate(
        { categoryCode: 'B', phase: 1, title: 'قواعد المرور الأساسية' },
        {
            categoryCode: 'B',
            subTypeCode: 'B1',
            phase: 1,
            title: 'قواعد المرور الأساسية',
            body: 'مقدمة في قواعد السير والأولويات والسرعات.',
            order: 1,
            interactiveQuestions: BANK_QUESTIONS.slice(0, 5),
            isActive: true,
            updatedBy: managerId || null,
        },
        { upsert: true, new: true },
    );

    await TrainingContentShared.findOneAndUpdate(
        { section: 'signs', title: 'الإشارات التحذيرية' },
        {
            section: 'signs',
            title: 'الإشارات التحذيرية',
            body: 'تنبّه السائق لوجود خطر محتمل وتحتاج إلى حذر إضافي.',
            order: 1,
            isActive: true,
        },
        { upsert: true, new: true },
    );

    await TrainingContentSpecific.findOneAndUpdate(
        { categoryCode: 'B', section: 'vehicle_ops', title: 'الركن الآمن' },
        {
            categoryCode: 'B',
            section: 'vehicle_ops',
            title: 'الركن الآمن',
            body: 'اختر مكاناً مرئياً، استخدم فرامل اليد، وأغلق المركبة.',
            order: 1,
            isActive: true,
        },
        { upsert: true, new: true },
    );

    await PracticalVideo.findOneAndUpdate(
        { categoryCode: 'B', title: 'الانطلاق والتوقف' },
        {
            categoryCode: 'B',
            subTypeCode: 'B1',
            phase: 1,
            title: 'الانطلاق والتوقف',
            url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
            durationSeconds: 300,
            order: 1,
            isActive: true,
        },
        { upsert: true, new: true },
    );

    if (schoolId && managerId) {
        await QuestionBank.findOneAndUpdate(
            { schoolId, title: 'بنك أسئلة فئة B — تجريبي' },
            {
                schoolId,
                title: 'بنك أسئلة فئة B — تجريبي',
                categoryCode: 'B',
                subTypeCode: 'B1',
                questions: BANK_QUESTIONS,
                addedBy: managerId,
                status: 'active',
            },
            { upsert: true, new: true },
        );
    }

    console.log('✓ contentSeed complete');
    await disconnectDatabase();
};

if (require.main === module) {
    contentSeed().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { contentSeed, SAMPLE_QUESTIONS, BANK_QUESTIONS };
