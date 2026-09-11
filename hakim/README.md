# HAKIM Ω Control Plane

هذا المجلد يحول «حكيم» من مجموعة قواعد وأدوات إلى **طبقة تحكم قابلة للاسترجاع والاختبار** فوق منظومة Ω الحالية.

## المكونات
- `HAKIM_SYSTEM_MANIFEST.json`: خريطة النظام والسلطة والطبقات.
- `HAKIM_TOOL_REGISTRY.json`: سجل الأدوات ومسارات الاختيار والتكلفة والصلاحية.
- `HAKIM_MEMORY_SCHEMA.json`: ذاكرة متعددة الطبقات مع provenance وحساسية ونطاق.
- `HAKIM_STATE.json`: حالة استئناف غير سرية.
- `EXECUTION_PROTOCOL.md`: بروتوكول التشغيل الكامل.
- `runtime/hakim-control-plane.mjs`: نواة تحقق/تخطيط حتمية.
- `runtime/test-hakim-control-plane.mjs`: اختبارات انحدار وفشل مغلق.
- `.github/workflows/hakim-control-plane.yml`: بوابة CI مستقلة.

## حدود السلطة
السجل لا يمنح صلاحيات سحرية. حكيم يستخدم الأداة فقط عندما يثبت اتصالها وصلاحيتها في البيئة الفعلية. لا تحفظ الأسرار في المستودع.

## تشغيل
```bash
node runtime/hakim-control-plane.mjs validate
node runtime/hakim-control-plane.mjs status
node runtime/hakim-control-plane.mjs plan phone_web_ui
node runtime/test-hakim-control-plane.mjs
```

هذه الطبقة **تركب فوق** DNA/lineage/gates الموجودة ولا تستبدلها ولا ترقي تلقائيًا أي baseline مثبت.
