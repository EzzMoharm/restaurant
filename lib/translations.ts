// lib/translations.ts
import { useSettingsStore } from "@/store/settings";

export const translations = {
  en: {
    // Navbar
    navMenu: "Menu",
    navMyOrders: "My Orders",
    navAdmin: "Admin Dashboard",
    navSignIn: "Sign In",
    navSignOut: "Sign Out",
    navLoggedInAs: "Logged in as",
    
    // Home Page
    homeTitle: "BiteFlow",
    homeSubtitle: "Fast, Fresh, Delicious Food Delivered To Your Table",
    categoryAll: "All Dishes",
    btnCustomize: "Customize & Add",
    btnAdded: "Added!",
    btnOutOfStock: "Out of Stock",
    
    // Cart Sheet
    cartTitle: "Your Dining Cart",
    cartEmpty: "Your Cart is Empty",
    cartBrowse: "Browse Menu and Add Meals!",
    cartSubtotal: "Subtotal",
    cartDelivery: "Delivery Fee",
    cartTax: "Tax & Service (8%)",
    cartTotal: "Total Amount",
    btnCheckout: "Proceed to Checkout",
    btnUpdate: "Update",
    
    // Profile Page
    profileTitle: "My Account Settings",
    profileSubtitle: "Customize your dining profile and manage your pre-filled shipping locations.",
    btnBackMenu: "Back to Menu",
    profileSectionPersonal: "Personal Details",
    lblUsername: "Display Name / Username",
    lblEmail: "Email Address (Primary Identity)",
    profileSectionDelivery: "Default Delivery Address (Checkout Autofill)",
    lblAddress: "Street Address",
    lblCity: "City / Region",
    lblPhone: "Phone Number",
    btnSaveProfile: "Save Profile Settings",
    btnSavingProfile: "Saving profile...",
    btnViewOrderHistory: "View Order History",
    btnLogoutSession: "Logout Session",
    
    // Orders Page
    ordersTitle: "My Restaurant Orders",
    ordersSubtitle: "Track live kitchen preparations and review past dining transactions.",
    btnRefreshList: "Refresh List",
    ordersActive: "Active Order Progress",
    ordersPast: "Past Order Transactions",
    ordersEmptyTitle: "No Orders Found Yet",
    ordersEmptyDesc: "It looks like you haven't placed any orders yet. Browse our delicious menu and check out your first meal!",
    ordersBtnOrderFood: "Order Delicious Food",
    ordersRef: "Ref",
    ordersTotalPaid: "Total Paid",
    ordersReceiptsHeader: "Ordered Receipts",
    ordersBtnReorder: "Re-order Items",
    ordersBtnReordering: "Adding to Cart...",
    ordersBtnViewSummary: "View Order Summary",
    ordersBtnRemoveOrder: "Remove Order",
    
    // Deletion Modal
    delModalTitle: "Remove Transaction History?",
    delModalDesc: "This will permanently remove this order from your dashboard records. This action cannot be undone.",
    delModalBtnCancel: "Keep Order",
    delModalBtnConfirm: "Remove",
    delModalRemoving: "Removing...",
    
    // Checkout Page
    checkoutTitle: "Checkout Gate",
    checkoutStepAddress: "1. Delivery Address",
    checkoutStepPayment: "2. Payment Selection",
    checkoutCardName: "Full Name",
    checkoutCardNumber: "Card Number",
    checkoutCardExpiry: "Expiry (MM/YY)",
    checkoutCardCvv: "CVV",
    checkoutPaymentCard: "Credit / Debit Card",
    checkoutPaymentCod: "Cash on Delivery",
    checkoutSummary: "Order Summary",
    checkoutBtnPlaceOrder: "Complete Order",
    checkoutBtnPlacing: "Authenticating & Placing Order...",
    checkoutPromoPlaceholder: "Enter WELCOME10 or BITE5",
    checkoutPromoApply: "Apply",
    
    // Success / Tracker Page
    successTitle: "Live Order Tracker",
    successCancelled: "Order Cancelled",
    successRef: "Reference",
    successPlacedAt: "Placed at",
    successStepReceived: "Received",
    successStepReceivedDesc: "Chef approved",
    successStepCooking: "Cooking",
    successStepCookingDesc: "In the kitchen",
    successStepReady: "Ready",
    successStepReadyDesc: "Quality packed",
    successStepWay: "On the Way",
    successStepWayDesc: "Out for delivery",
    successStepArrived: "Arrived",
    successStepArrivedDesc: "Delivered safely",
    successEtaTitle: "Estimated Preparation & Transit",
    successEtaDesc: "Delicious dishes are estimated to reach your dining table within 25 - 35 minutes. Feel free to watch kitchen progress in real-time.",
    successReceiptTitle: "Itemized Receipt",
    successDeliveryDetails: "Delivery Details",
    successRecipient: "Recipient Name",
    successDestination: "Delivery Destination",
    successPhone: "Phone Line",
    successPayment: "Payment",
    successTotalPaid: "Total Paid",
    successStoredSecurely: "Stored securely on checkout device",
    successStoredLocally: "Stored locally",
    successReceiptUnavailable: "Receipt Details Unavailable",
  },
  ar: {
    // Navbar
    navMenu: "القائمة",
    navMyOrders: "طلباتي",
    navAdmin: "لوحة التحكم",
    navSignIn: "تسجيل الدخول",
    navSignOut: "تسجيل الخروج",
    navLoggedInAs: "مسجل الدخول كـ",
    
    // Home Page
    homeTitle: "بايت فلو",
    homeSubtitle: "طعام سريع، طازج ولذيذ يصل مباشرة إلى طاولتك",
    categoryAll: "جميع الأطباق",
    btnCustomize: "تخصيص وإضافة",
    btnAdded: "تمت الإضافة!",
    btnOutOfStock: "نفدت الكمية",
    
    // Cart Sheet
    cartTitle: "سلة الطعام الخاصة بك",
    cartEmpty: "سلة التسوق فارغة",
    cartBrowse: "تصفح القائمة وأضف وجباتك اللذيذة!",
    cartSubtotal: "المجموع الفرعي",
    cartDelivery: "رسوم التوصيل",
    cartTax: "الضريبة والخدمة (8%)",
    cartTotal: "المجموع الكلي",
    btnCheckout: "الذهاب للدفع",
    btnUpdate: "تحديث",
    
    // Profile Page
    profileTitle: "إعدادات حسابي",
    profileSubtitle: "قم بتخصيص ملفك الشخصي وإدارة مواقع الشحن الافتراضية الخاصة بك.",
    btnBackMenu: "العودة للقائمة",
    profileSectionPersonal: "التفاصيل الشخصية",
    lblUsername: "الاسم المعروض / اسم المستخدم",
    lblEmail: "عنوان البريد الإلكتروني (الهوية الأساسية)",
    profileSectionDelivery: "عنوان التوصيل الافتراضي (التعبئة التلقائية عند الدفع)",
    lblAddress: "عنوان الشارع",
    lblCity: "المدينة / المنطقة",
    lblPhone: "رقم الهاتف",
    btnSaveProfile: "حفظ إعدادات الملف الشخصي",
    btnSavingProfile: "جاري الحفظ...",
    btnViewOrderHistory: "عرض سجل الطلبات",
    btnLogoutSession: "تسجيل الخروج من الجلسة",
    
    // Orders Page
    ordersTitle: "طلبات المطعم الخاصة بي",
    ordersSubtitle: "تتبع تحضيرات المطبخ المباشرة وراجع معاملاتك السابقة.",
    btnRefreshList: "تحديث القائمة",
    ordersActive: "متابعة الطلبات النشطة",
    ordersPast: "معاملات الطلبات السابقة",
    ordersEmptyTitle: "لم يتم العثور على طلبات بعد",
    ordersEmptyDesc: "يبدو أنك لم تقم بطلب أي وجبة حتى الآن. تصفح قائمتنا اللذيذة وقم بإتمام طلبك الأول!",
    ordersBtnOrderFood: "اطلب طعاماً لذيذاً",
    ordersRef: "مرجع",
    ordersTotalPaid: "إجمالي المدفوع",
    ordersReceiptsHeader: "الفواتير المطلوبة",
    ordersBtnReorder: "إعادة طلب الوجبات",
    ordersBtnReordering: "جاري الإضافة للسلة...",
    ordersBtnViewSummary: "عرض ملخص الطلب",
    ordersBtnRemoveOrder: "حذف الطلب",
    
    // Deletion Modal
    delModalTitle: "حذف سجل المعاملة؟",
    delModalDesc: "سيؤدي هذا إلى حذف هذا الطلب نهائيًا من سجلات لوحة التحكم الخاصة بك. لا يمكن التراجع عن هذا الإجراء.",
    delModalBtnCancel: "الاحتفاظ بالطلب",
    delModalBtnConfirm: "حذف",
    delModalRemoving: "جاري الحذف...",
    
    // Checkout Page
    checkoutTitle: "بوابة الدفع والتأكيد",
    checkoutStepAddress: "1. عنوان التوصيل",
    checkoutStepPayment: "2. طريقة الدفع",
    checkoutCardName: "الاسم الكامل",
    checkoutCardNumber: "رقم البطاقة",
    checkoutCardExpiry: "تاريخ الانتهاء (MM/YY)",
    checkoutCardCvv: "الرمز السري (CVV)",
    checkoutPaymentCard: "بطاقة الائتمان / الخصم",
    checkoutPaymentCod: "الدفع عند الاستلام",
    checkoutSummary: "ملخص الطلب",
    checkoutBtnPlaceOrder: "إتمام الطلب",
    checkoutBtnPlacing: "جاري التحقق وإتمام الطلب...",
    checkoutPromoPlaceholder: "أدخل WELCOME10 أو BITE5",
    checkoutPromoApply: "تطبيق",
    
    // Success / Tracker Page
    successTitle: "تتبع الطلبات المباشر",
    successCancelled: "تم إلغاء الطلب",
    successRef: "المرجع",
    successPlacedAt: "تم الطلب في",
    successStepReceived: "تم الاستلام",
    successStepReceivedDesc: "موافقة الشيف",
    successStepCooking: "طهي الطعام",
    successStepCookingDesc: "في المطبخ الآن",
    successStepReady: "جاهز",
    successStepReadyDesc: "مغلف بجودة عالية",
    successStepWay: "في الطريق",
    successStepWayDesc: "خارج للتوصيل",
    successStepArrived: "وصل",
    successStepArrivedDesc: "تم التوصيل بأمان",
    successEtaTitle: "الوقت المقدر للتحضير والتوصيل",
    successEtaDesc: "من المقدر أن تصل أطباقك اللذيذة إلى مائدتك خلال 25 - 35 دقيقة. يمكنك تحديث هذه الصفحة لمتابعة تقدم تحضير الطعام في الوقت الفعلي.",
    successReceiptTitle: "الفاتورة المفصلة",
    successDeliveryDetails: "تفاصيل التوصيل",
    successRecipient: "اسم المستلم",
    successDestination: "وجهة التوصيل",
    successPhone: "رقم الهاتف",
    successPayment: "الدفع",
    successTotalPaid: "إجمالي المدفوع",
    successStoredSecurely: "محفوظ بأمان على جهاز الطلب",
    successStoredLocally: "محفوظ محلياً",
    successReceiptUnavailable: "تفاصيل الفاتورة غير متاحة",
  }
};

export function useTranslation() {
  const lang = useSettingsStore((state) => state.lang);
  const t = translations[lang];
  return { t, lang };
}

export const translateMenu = (name: string, lang: string) => {
  if (lang !== 'ar') return name;
  const map: Record<string, string> = {
    // Categories
    "Drinks": "مشروبات",
    "Desserts": "حلويات",
    "Burgers": "برجر",
    "Pizzas": "بيتزا",
    "Main": "الرئيسية",
    // Products
    "Fresh Lemonade": "ليموناضة طازجة",
    "BBQ Bacon Burger": "برجر لحم البقر بصلصة الشواء والقديد",
    "Gelato Trio": "جيلاتو ثلاثي النكهات",
    "Double Cheeseburger": "تشيز برجر مضاعف",
    "Classic Pizza": "بيتزا كلاسيكية",
    "Chocolate Lava Cake": "كعكة الشوكولاتة الذائبة",
    "Deleted Dish": "طبق محذوف",
    "Delicious Menu Item": "وجبة شهية"
  };
  return map[name] || name;
};
