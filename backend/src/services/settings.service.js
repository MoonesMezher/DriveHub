const { PlatformSetting } = require('../models');

const PRIVACY_KEY = 'privacy_policy';
const REGISTRATION_PAUSED_KEY = 'registration_paused';

const DEFAULT_PRIVACY = `# سياسة الخصوصية — DriveHub

## مقدمة
نحن في **DriveHub** نلتزم بحماية بياناتك الشخصية وفقاً للقوانين المعمول بها. توضّح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام منصتنا.

## البيانات التي نجمعها
- **بيانات الحساب:** الاسم، البريد الإلكتروني، رقم الهاتف.
- **بيانات التسجيل:** المدرسة المختارة، فئة الرخصة، مستندات التقديم.
- **بيانات الاستخدام:** سجل الدروس، نتائج الامتحانات، التقدم التعليمي.
- **الموقع الجغرافي:** عند البحث عن مدارس قريبة (بموافقتك).

## كيف نستخدم بياناتك
- إدارة اشتراكك في دورات تعليم القيادة.
- التنسيق مع المدارس وإدارة المرور.
- تحسين تجربة المنصة ودعم المستخدمين.
- إرسال إشعارات متعلقة بالدورة والامتحانات.

## مشاركة البيانات
نشارك البيانات الضرورية فقط مع:
- **مدرسة القيادة** التي اشتركت بها.
- **إدارة المرور** لأغراض الامتحانات وإصدار الرخص.
- **مزودي الدفع** لمعالجة المدفوعات بشكل آمن.

لا نبيع بياناتك لأطراف ثالثة.

## حماية البيانات
نطبّق إجراءات أمنية تقنية وإدارية لحماية بياناتك من الوصول غير المصرّح به.

## حقوقك
يمكنك طلب الوصول إلى بياناتك أو تصحيحها أو حذف حسابك عبر التواصل مع الدعم.

## التحديثات
قد نحدّث هذه السياسة. سننشر أي تغييرات على هذه الصفحة.

---
*آخر تحديث: ${new Date().toISOString().slice(0, 10)}*
`;

class SettingsService {
    async getPrivacy() {
        const doc = await PlatformSetting.findOne({ key: PRIVACY_KEY }).lean();
        return { content: doc?.value ?? DEFAULT_PRIVACY, updatedAt: doc?.updatedAt ?? null };
    }

    async updatePrivacy(content, adminId) {
        const doc = await PlatformSetting.findOneAndUpdate(
            { key: PRIVACY_KEY },
            { key: PRIVACY_KEY, value: content, updatedBy: adminId },
            { upsert: true, new: true, runValidators: true },
        );
        return { content: doc.value, updatedAt: doc.updatedAt };
    }

    async seedPrivacy() {
        const existing = await PlatformSetting.findOne({ key: PRIVACY_KEY });
        if (!existing) {
            await PlatformSetting.create({ key: PRIVACY_KEY, value: DEFAULT_PRIVACY });
        }
    }

    async isRegistrationPaused() {
        const doc = await PlatformSetting.findOne({ key: REGISTRATION_PAUSED_KEY }).lean();
        return doc?.value === 'true';
    }

    async getRegistrationSettings() {
        return { registrationPaused: await this.isRegistrationPaused() };
    }

    async updateRegistrationSettings({ registrationPaused }, adminId) {
        const doc = await PlatformSetting.findOneAndUpdate(
            { key: REGISTRATION_PAUSED_KEY },
            {
                key: REGISTRATION_PAUSED_KEY,
                value: registrationPaused ? 'true' : 'false',
                updatedBy: adminId,
            },
            { upsert: true, new: true, runValidators: true },
        );
        return { registrationPaused: doc.value === 'true' };
    }
}

module.exports = new SettingsService();
