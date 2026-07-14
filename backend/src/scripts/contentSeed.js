const { connectDatabase, disconnectDatabase } = require('../config/database');
const {
    TheoryContent,
    TrainingContentShared,
    TrainingContentSpecific,
    PracticalVideo,
    QuestionBank,
    FaqItem,
    RequirementItem,
    Testimonial,
} = require('../models');

// Static driving imagery — served from frontend public/images/driving
const MEDIA = {
    trafficLight: '/images/driving/traffic-light.jpg',
    roadSigns: '/images/driving/road-signs.jpg',
    drivingLesson: '/images/driving/driving-lesson.jpg',
    parking: '/images/driving/parking.jpg',
    safety: '/images/driving/safety.jpg',
    videoThumb: '/images/driving/video-thumb.jpg',
  // Public driving-education videos that allow embedding (verified via YouTube oEmbed)
    videoIntro: 'https://www.youtube-nocookie.com/embed/KxrfkcDAgsY',
    videoSigns: 'https://www.youtube-nocookie.com/embed/G3_1Yh0Lb_E',
    videoParking: 'https://www.youtube-nocookie.com/embed/l4LcfZeS4qw',
};

const makeMcq = (text, options, correctKey, explanation = '', imageUrl = null) => ({
    text,
    type: 'mcq',
    options,
    correctAnswer: correctKey,
    explanation,
    imageUrl,
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
        MEDIA.trafficLight,
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
        MEDIA.safety,
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
        MEDIA.roadSigns,
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
    const shouldDisconnect = !schoolId;
    if (shouldDisconnect) await connectDatabase();

    // ── Sample content (articles + videos + questions) ──
    await TheoryContent.findOneAndUpdate(
        { categoryCode: 'B', isSample: true, sampleTier: 'partial' },
        {
            categoryCode: 'B',
            phase: 0,
            title: 'مقدمة في قواعد المرور',
            body: `## مرحباً بك في العينة المجانية

تعلّم أساسيات القيادة الآمنة من خلال **مقالات نظرية** و**فيديوهات توضيحية** و**أسئلة تفاعلية**.

### ما ستتعلمه:
- معنى الإشارات الضوئية وكيفية الالتزام بها
- المسافة الآمنة بين المركبات
- استخدام أضواء الطوارئ في الظروف المناسبة

> نصيحة: اقرأ المقال أولاً، شاهد الفيديو، ثم اختبر فهمك بالأسئلة أدناه.`,
            imageUrl: MEDIA.trafficLight,
            videoUrl: MEDIA.videoIntro,
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
            title: 'دليل السلامة على الطريق',
            body: `## محتوى إضافي للمسجّلين

بعد التسجيل تحصل على مقالات موسّعة تغطي:
- **السرعات** المسموحة في مختلف المناطق
- **قواعد الأولوية** عند التقاطعات
- **العلامات المرورية** ومعانيها

شاهد الفيديو التعليمي عن الإشارات ثم أجب على الأسئلة الإضافية.`,
            imageUrl: MEDIA.roadSigns,
            videoUrl: MEDIA.videoSigns,
            order: 1,
            isSample: true,
            sampleTier: 'full',
            interactiveQuestions: SAMPLE_QUESTIONS,
            isActive: true,
        },
        { upsert: true, new: true },
    );

    // ── Core theory lessons ──
    const coreLessons = [
        {
            filter: { categoryCode: 'B', phase: 1, title: 'قواعد المرور الأساسية' },
            data: {
                categoryCode: 'B',
                subTypeCode: 'B1',
                phase: 1,
                title: 'قواعد المرور الأساسية',
                body: 'مقدمة شاملة في قواعد السير: الأولويات، السرعات، وسلوك السائق المسؤول. يتضمن شرحاً نظرياً مع أمثلة عملية من الطرق السورية.',
                imageUrl: MEDIA.drivingLesson,
                videoUrl: MEDIA.videoIntro,
                order: 1,
                interactiveQuestions: BANK_QUESTIONS.slice(0, 5),
                isActive: true,
                updatedBy: managerId || null,
            },
        },
        {
            filter: { categoryCode: 'B', phase: 1, title: 'الإشارات الضوئية والعلامات' },
            data: {
                categoryCode: 'B',
                subTypeCode: 'B1',
                phase: 1,
                title: 'الإشارات الضوئية والعلامات',
                body: 'شرح تفصيلي للإشارات الضوئية (أحمر، أصفر، أخضر) والعلامات الأرضية. تعلّم كيف تتفاعل مع كل إشارة بشكل صحيح.',
                imageUrl: MEDIA.trafficLight,
                videoUrl: MEDIA.videoSigns,
                order: 2,
                interactiveQuestions: BANK_QUESTIONS.slice(3, 6),
                isActive: true,
                updatedBy: managerId || null,
            },
        },
        {
            filter: { categoryCode: 'B', phase: 2, title: 'السلامة المرورية' },
            data: {
                categoryCode: 'B',
                subTypeCode: 'B1',
                phase: 2,
                title: 'السلامة المرورية',
                body: 'مبادئ السلامة: حزام الأمان، المسافة الآمنة، القيادة الدفاعية، والتعامل مع الظروف الجوية الصعبة.',
                imageUrl: MEDIA.safety,
                order: 1,
                interactiveQuestions: BANK_QUESTIONS.slice(6, 9),
                isActive: true,
                updatedBy: managerId || null,
            },
        },
    ];

    for (const lesson of coreLessons) {
        await TheoryContent.findOneAndUpdate(lesson.filter, lesson.data, { upsert: true, new: true });
    }

    // ── Shared training content ──
    const sharedContent = [
        {
            filter: { section: 'signs', title: 'الإشارات التحذيرية' },
            data: {
                section: 'signs',
                title: 'الإشارات التحذيرية',
                body: 'الإشارات التحذيرية مثلّثة الشكل ذات حافة حمراء. تنبّه السائق لوجود خطر محتمل: منعطف حاد، تقاطع، مشاة، أو طريق زلق.',
                mediaUrl: MEDIA.roadSigns,
                order: 1,
                isActive: true,
            },
        },
        {
            filter: { section: 'rules', title: 'قواعد الأولوية' },
            data: {
                section: 'rules',
                title: 'قواعد الأولوية',
                body: 'عند التقاطعات بدون إشارات: الأولوية للقادم من اليمين. عند الدوار: الأولوية للمركبات داخل الدوار. احترم إشارات الشرطة دائماً.',
                mediaUrl: MEDIA.trafficLight,
                order: 1,
                isActive: true,
            },
        },
        {
            filter: { section: 'safety', title: 'معدات السلامة' },
            data: {
                section: 'safety',
                title: 'معدات السلامة',
                body: 'حزام الأمان، المثلث العاكس، طفاية الحريق، وحقيبة الإسعافات الأولية — تأكد من توفرها في مركبتك.',
                mediaUrl: MEDIA.safety,
                order: 1,
                isActive: true,
            },
        },
    ];

    for (const item of sharedContent) {
        await TrainingContentShared.findOneAndUpdate(item.filter, item.data, { upsert: true, new: true });
    }

    // ── Category-specific content ──
    const specificContent = [
        {
            filter: { categoryCode: 'B', section: 'vehicle_ops', title: 'الركن الآمن' },
            data: {
                categoryCode: 'B',
                section: 'vehicle_ops',
                title: 'الركن الآمن',
                body: 'اختر مكاناً مرئياً، استخدم فرامل اليد، أغلق المركبة، وتحقق من المرايا قبل فتح الباب.',
                mediaUrl: MEDIA.parking,
                order: 1,
                isActive: true,
            },
        },
        {
            filter: { categoryCode: 'B', section: 'mechanics', title: 'فحص المركبة قبل القيادة' },
            data: {
                categoryCode: 'B',
                section: 'mechanics',
                title: 'فحص المركبة قبل القيادة',
                body: 'تحقق من: مستوى الزيت، ضغط الإطارات، مستوى سائل التبريد، عمل الأنوار والإشارات، ونظافة المرايا.',
                mediaUrl: MEDIA.drivingLesson,
                order: 1,
                isActive: true,
            },
        },
    ];

    for (const item of specificContent) {
        await TrainingContentSpecific.findOneAndUpdate(item.filter, item.data, { upsert: true, new: true });
    }

    // ── Videos (sample + core) ──
    const videos = [
        {
            filter: { categoryCode: 'B', title: 'مقدمة — العينة المجانية', isSample: true },
            data: {
                categoryCode: 'B',
                phase: 0,
                title: 'مقدمة — العينة المجانية',
                url: MEDIA.videoIntro,
                thumbnailUrl: MEDIA.videoThumb,
                durationSeconds: 180,
                order: 0,
                isSample: true,
                isActive: true,
            },
        },
        {
            filter: { categoryCode: 'B', title: 'الإشارات المرورية — عينة', isSample: true },
            data: {
                categoryCode: 'B',
                phase: 0,
                title: 'الإشارات المرورية — عينة',
                url: MEDIA.videoSigns,
                thumbnailUrl: MEDIA.roadSigns,
                durationSeconds: 240,
                order: 1,
                isSample: true,
                isActive: true,
            },
        },
        {
            filter: { categoryCode: 'B', title: 'الانطلاق والتوقف' },
            data: {
                categoryCode: 'B',
                subTypeCode: 'B1',
                phase: 1,
                title: 'الانطلاق والتوقف',
                url: MEDIA.videoIntro,
                thumbnailUrl: MEDIA.videoThumb,
                durationSeconds: 300,
                order: 1,
                isActive: true,
            },
        },
        {
            filter: { categoryCode: 'B', title: 'الركن الموازي' },
            data: {
                categoryCode: 'B',
                subTypeCode: 'B1',
                phase: 2,
                title: 'الركن الموازي',
                url: MEDIA.videoParking,
                thumbnailUrl: MEDIA.parking,
                durationSeconds: 420,
                order: 1,
                isActive: true,
            },
        },
    ];

    for (const video of videos) {
        await PracticalVideo.findOneAndUpdate(video.filter, video.data, { upsert: true, new: true });
    }

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

    // ── Public content: FAQ, requirements, testimonials ──
    const faqItems = [
        { question: 'كيف أنشئ حساباً على DriveHub؟', answer: 'اضغط «تسجيل جديد» من الصفحة الرئيسية وأدخل بياناتك الأساسية.', category: 'التسجيل', order: 1 },
        { question: 'متى أدفع رسوم الدورة؟', answer: 'بعد قبول المدرسة لطلبك — ادفع مباشرةً للمدرسة ثم أعلِمنا من صفحة الاشتراك.', category: 'الدفع', order: 2 },
        { question: 'هل المحتوى النظري مجاني؟', answer: 'نوفر عينة مجانية للزائر؛ المحتوى الكامل متاح بعد الاشتراك في دورة.', category: 'التعلم', order: 3 },
    ];
    for (const faq of faqItems) {
        await FaqItem.findOneAndUpdate({ question: faq.question }, { ...faq, isActive: true }, { upsert: true, new: true });
    }

    const requirementItems = [
        { title: 'السن القانوني', description: 'يجب بلوغ الحد الأدنى للعمر حسب فئة الرخصة (18 سنة للخصوصي، 21 للعمومي).', icon: 'cake', imageUrl: '/images/driving/license.jpg', order: 1 },
        { title: 'الهوية الوطنية', description: 'بطاقة هوية سارية أو جواز سفر مع إثبات الإقامة للمقيمين.', icon: 'badge', imageUrl: '/images/driving/exam.jpg', order: 2 },
        { title: 'الفحص الطبي', description: 'شهادة لياقة طبية من جهة معتمدة تثبت قدرتك على القيادة.', icon: 'health_and_safety', imageUrl: '/images/driving/medical.jpg', order: 3 },
        { title: 'التسجيل في مدرسة', description: 'اختيار مدرسة معتمدة ودفع رسوم الدورة مباشرةً للمدرسة.', icon: 'school', imageUrl: '/images/driving/school.jpg', order: 4 },
    ];
    for (const req of requirementItems) {
        await RequirementItem.findOneAndUpdate({ title: req.title }, { ...req, isActive: true }, { upsert: true, new: true });
    }

    const testimonials = [
        { name: 'أحمد ك.', role: 'طالب', quote: 'فهمت كل خطوات الرخصة من أول نظرة على المنصة', rating: 5, order: 1 },
        { name: 'سارة م.', role: 'متخرجة', quote: 'اختبار تجريبي ساعدني قبل امتحان المرور', rating: 5, order: 2 },
        { name: 'محمد ع.', role: 'طالب', quote: 'لقيت مدرسة قريبة واشتركت خلال دقائق', rating: 4, order: 3 },
    ];
    for (const t of testimonials) {
        await Testimonial.findOneAndUpdate({ name: t.name, quote: t.quote }, { ...t, isActive: true }, { upsert: true, new: true });
    }

    console.log('✓ contentSeed complete');
    if (shouldDisconnect) await disconnectDatabase();
};

if (require.main === module) {
    contentSeed().catch((err) => {
        console.error(err);
        process.exit(1);
    });
}

module.exports = { contentSeed, SAMPLE_QUESTIONS, BANK_QUESTIONS, MEDIA };
