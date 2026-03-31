import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "issues": "Issues",
        "report": "Report Issue",
        "admin": "Admin Dashboard",
        "login": "Login",
        "register": "Register",
        "logout": "Logout",
        "profile": "Profile"
      },
      "home": {
        "title": "Report Issues, Improve Your City",
        "subtitle": "A community-driven platform to report infrastructure issues like potholes, broken streetlights, and garbage. Connect directly with city authorities to get them resolved.",
        "get_started": "Report an Issue",
        "view_issues": "View Issues",
        "how_it_works": "How it works",
        "building_smarter": "Building a smarter city together",
        "spot_title": "Spot & Pin",
        "spot_desc": "See an issue? Take a photo and pin the exact location on our interactive map.",
        "community_title": "Community Support",
        "community_desc": "Upvote issues reported by others to help authorities prioritize the most urgent problems.",
        "action_title": "Direct Action",
        "action_desc": "Authorities track and update the status of reports from \"Pending\" to \"Resolved\".",
        "status_pending_desc": "Issue reported and awaiting review.",
        "status_progress_desc": "Work has started to fix the issue.",
        "status_resolved_desc": "The issue has been successfully fixed."
      },
      "issues": {
        "title": "Community Issues",
        "subtitle": "View and support infrastructure reports in your area.",
        "report_new": "Report New Issue",
        "search_placeholder": "Search issues...",
        "all_categories": "All Categories",
        "potholes": "Potholes",
        "garbage": "Garbage",
        "streetlights": "Streetlights",
        "water": "Water/Sewage",
        "other": "Other",
        "status_label": "Status",
        "category_label": "Category",
        "sort_label": "Sort By",
        "status": {
          "all": "All Statuses",
          "pending": "Pending",
          "in-progress": "In Progress",
          "resolved": "Resolved",
          "rejected": "Rejected"
        },
        "sort": {
          "latest": "Latest First",
          "votes": "Most Voted",
          "priority": "Priority"
        },
        "no_issues": "No issues found",
        "no_issues_desc": "We couldn't find any issues matching your criteria. Be the first to report a problem in your neighborhood!",
        "clear_filters": "Clear all filters",
        "details": "Details",
        "by": "by",
        "anonymous": "Anonymous"
      },
      "report": {
        "title": "Report a Community Issue",
        "subtitle": "Provide details about the problem you've spotted.",
        "ai_analyze": "AI Analyze",
        "ai_analyzing": "AI Analyzing...",
        "locate_me": "Locate Me",
        "success_title": "Issue Reported!",
        "success_desc": "Thank you for contributing to your community. Redirecting you to the issues list...",
        "error_image": "Please upload an image of the issue",
        "error_location": "Please select a location on the map",
        "error_geolocation": "Could not access your location. Please check your browser permissions.",
        "error_unsupported": "Geolocation is not supported by your browser.",
        "form": {
          "title_label": "Issue Title",
          "title_placeholder": "e.g., Large pothole on Main St",
          "desc_label": "Description",
          "desc_placeholder": "Describe the issue in more detail...",
          "category_label": "Category",
          "image_label": "Upload Image",
          "image_click": "Click to upload photo",
          "location_label": "Select Location",
          "location_hint": "Click on the map to pin the exact location of the issue.",
          "submit": "Submit Report",
          "submitting": "Submitting..."
        }
      },
      "admin": {
        "title": "Admin Dashboard",
        "refresh_ai": "Refresh AI Insights",
        "analyzing": "Analyzing...",
        "stats": {
          "total": "Total",
          "total_desc": "Issues reported",
          "pending": "Pending",
          "pending_desc": "Awaiting review",
          "active": "Active",
          "active_desc": "In progress",
          "resolved": "Resolved",
          "resolved_desc": "Successfully fixed"
        },
        "ai_insights": "AI City Insights",
        "ai_recommendations": "AI Recommendations",
        "review_title": "Issues Awaiting Review",
        "view_all": "View All",
        "table": {
          "title": "Title",
          "category": "Category",
          "reported_on": "Reported On",
          "votes": "Votes",
          "action": "Action",
          "no_pending": "No pending issues to review. Great job!",
          "view": "View",
          "approve": "Approve",
          "reject": "Reject"
        },
        "charts": {
          "category": "Issues by Category",
          "status": "Status Distribution"
        }
      }
    }
  },
  hi: {
    translation: {
      "nav": {
        "home": "होम",
        "issues": "मुद्दे",
        "report": "मुद्दा रिपोर्ट करें",
        "admin": "एडमिन डैशबोर्ड",
        "login": "लॉगिन",
        "register": "रजिस्टर",
        "logout": "लॉगआउट",
        "profile": "प्रोफ़ाइल"
      },
      "home": {
        "title": "मुद्दों की रिपोर्ट करें, अपने शहर को बेहतर बनाएं",
        "subtitle": "गड्ढों, टूटी स्ट्रीटलाइट्स और कचरे जैसे बुनियादी ढांचे के मुद्दों की रिपोर्ट करने के लिए एक समुदाय-संचालित मंच। उन्हें हल करने के लिए सीधे शहर के अधिकारियों से जुड़ें।",
        "get_started": "एक मुद्दा रिपोर्ट करें",
        "view_issues": "मुद्दे देखें",
        "how_it_works": "यह कैसे काम करता है",
        "building_smarter": "मिलकर एक स्मार्ट शहर का निर्माण",
        "spot_title": "स्पॉट और पिन",
        "spot_desc": "कोई समस्या देखें? एक फोटो लें और हमारे इंटरेक्टिव मानचित्र पर सटीक स्थान पिन करें।",
        "community_title": "सामुदायिक सहायता",
        "community_desc": "अधिकारियों को सबसे जरूरी समस्याओं को प्राथमिकता देने में मदद करने के लिए दूसरों द्वारा रिपोर्ट किए गए मुद्दों को अपवोट करें।",
        "action_title": "प्रत्यक्ष कार्रवाई",
        "action_desc": "अधिकारी \"लंबित\" से \"हल\" तक रिपोर्ट की स्थिति को ट्रैक और अपडेट करते हैं।",
        "status_pending_desc": "मुद्दे की रिपोर्ट की गई और समीक्षा की प्रतीक्षा है।",
        "status_progress_desc": "मुद्दे को ठीक करने का काम शुरू हो गया है।",
        "status_resolved_desc": "मुद्दे को सफलतापूर्वक ठीक कर दिया गया है।"
      },
      "issues": {
        "title": "सामुदायिक मुद्दे",
        "subtitle": "अपने क्षेत्र में बुनियादी ढांचे की रिपोर्ट देखें और उनका समर्थन करें।",
        "report_new": "नया मुद्दा रिपोर्ट करें",
        "search_placeholder": "मुद्दे खोजें...",
        "all_categories": "सभी श्रेणियां",
        "potholes": "गड्ढे",
        "garbage": "कचरा",
        "streetlights": "स्ट्रीटलाइट्स",
        "water": "पानी/सीवेज",
        "other": "अन्य",
        "status_label": "स्थिति",
        "category_label": "श्रेणी",
        "sort_label": "इसके अनुसार क्रमबद्ध करें",
        "status": {
          "all": "सभी स्थितियां",
          "pending": "लंबित",
          "in-progress": "प्रगति पर",
          "resolved": "हल किया गया",
          "rejected": "अस्वीकृत"
        },
        "sort": {
          "latest": "नवीनतम पहले",
          "votes": "सर्वाधिक वोट",
          "priority": "प्राथमिकता"
        },
        "no_issues": "कोई मुद्दा नहीं मिला",
        "no_issues_desc": "हमें आपके मानदंडों से मेल खाने वाला कोई मुद्दा नहीं मिला। अपने पड़ोस में समस्या की रिपोर्ट करने वाले पहले व्यक्ति बनें!",
        "clear_filters": "सभी फ़िल्टर साफ़ करें",
        "details": "विवरण",
        "by": "द्वारा",
        "anonymous": "अनाम"
      },
      "report": {
        "title": "एक सामुदायिक मुद्दे की रिपोर्ट करें",
        "subtitle": "आपके द्वारा देखी गई समस्या के बारे में विवरण प्रदान करें।",
        "ai_analyze": "AI विश्लेषण",
        "ai_analyzing": "AI विश्लेषण कर रहा है...",
        "locate_me": "मेरी स्थिति जानें",
        "success_title": "मुद्दा रिपोर्ट किया गया!",
        "success_desc": "आपके समुदाय में योगदान देने के लिए धन्यवाद। आपको मुद्दों की सूची पर वापस ले जाया जा रहा है...",
        "error_image": "कृपया मुद्दे की एक फोटो अपलोड करें",
        "error_location": "कृपया मानचित्र पर स्थान चुनें",
        "error_geolocation": "आपके स्थान तक नहीं पहुँचा जा सका। कृपया अपने ब्राउज़र की अनुमति जाँचें।",
        "error_unsupported": "आपका ब्राउज़र जियोलोकेशन का समर्थन नहीं करता है।",
        "form": {
          "title_label": "मुद्दे का शीर्षक",
          "title_placeholder": "जैसे, मेन सेंट पर बड़ा गड्ढा",
          "desc_label": "विवरण",
          "desc_placeholder": "मुद्दे के बारे में अधिक विस्तार से बताएं...",
          "category_label": "श्रेणी",
          "image_label": "फोटो अपलोड करें",
          "image_click": "फोटो अपलोड करने के लिए क्लिक करें",
          "location_label": "स्थान चुनें",
          "location_hint": "मुद्दे के सटीक स्थान को पिन करने के लिए मानचित्र पर क्लिक करें।",
          "submit": "रिपोर्ट सबमिट करें",
          "submitting": "सबमिट हो रहा है..."
        }
      },
      "admin": {
        "title": "एडमिन डैशबोर्ड",
        "refresh_ai": "AI अंतर्दृष्टि ताज़ा करें",
        "analyzing": "विश्लेषण हो रहा है...",
        "stats": {
          "total": "कुल",
          "total_desc": "रिपोर्ट किए गए मुद्दे",
          "pending": "लंबित",
          "pending_desc": "समीक्षा की प्रतीक्षा में",
          "active": "सक्रिय",
          "active_desc": "प्रगति में",
          "resolved": "सुलझाया गया",
          "resolved_desc": "सफलतापूर्वक ठीक किया गया"
        },
        "ai_insights": "AI शहर अंतर्दृष्टि",
        "ai_recommendations": "AI सिफारिशें",
        "review_title": "समीक्षा की प्रतीक्षा में मुद्दे",
        "view_all": "सभी देखें",
        "table": {
          "title": "शीर्षक",
          "category": "श्रेणी",
          "reported_on": "रिपोर्ट की तारीख",
          "votes": "वोट",
          "action": "कार्रवाई",
          "no_pending": "समीक्षा के लिए कोई लंबित मुद्दा नहीं है। बहुत बढ़िया!",
          "view": "देखें",
          "approve": "स्वीकार करें",
          "reject": "अस्वीकार करें"
        },
        "charts": {
          "category": "श्रेणी के अनुसार मुद्दे",
          "status": "स्थिति वितरण"
        }
      }
    }
  },
  ta: {
    translation: {
      "nav": {
        "home": "முகப்பு",
        "issues": "பிரச்சினைகள்",
        "report": "புகார் அளிக்கவும்",
        "admin": "நிர்வாகி டாஷ்போர்டு",
        "login": "உள்நுழை",
        "register": "பதிவு செய்",
        "logout": "வெளியேறு",
        "profile": "சுயவிவரம்"
      },
      "home": {
        "title": "பிரச்சினைகளைப் புகாரளிக்கவும், உங்கள் நகரத்தை மேம்படுத்தவும்",
        "subtitle": "குழிகள், உடைந்த தெருவிளக்குகள் மற்றும் குப்பைகள் போன்ற உள்கட்டமைப்பு பிரச்சினைகளைப் புகாரளிப்பதற்கான சமூக உந்துதல் தளம். அவற்றைத் தீர்க்க நகர அதிகாரிகளுடன் நேரடியாக இணையுங்கள்.",
        "get_started": "ஒரு பிரச்சினையைப் புகாரளிக்கவும்",
        "view_issues": "பிரச்சினைகளைப் பார்க்கவும்",
        "how_it_works": "இது எப்படி வேலை செய்கிறது",
        "building_smarter": "ஒன்றாக ஒரு சிறந்த நகரத்தை உருவாக்குதல்",
        "spot_title": "கண்டறிந்து பின் செய்யவும்",
        "spot_desc": "ஒரு பிரச்சினையைப் பார்க்கிறீர்களா? புகைப்படம் எடுத்து எங்கள் ஊடாடும் வரைபடத்தில் சரியான இடத்தைப் பின் செய்யவும்.",
        "community_title": "சமூக ஆதரவு",
        "community_desc": "மிகவும் அவசரமான பிரச்சினைகளுக்கு முன்னுரிமை அளிக்க அதிகாரிகளுக்கு உதவ மற்றவர்கள் புகாரளித்த பிரச்சினைகளுக்கு வாக்களிக்கவும்.",
        "action_title": "நேரடி நடவடிக்கை",
        "action_desc": "அதிகாரிகள் புகார்களின் நிலையை \"நிலுவையில் உள்ளது\" என்பதிலிருந்து \"தீர்க்கப்பட்டது\" வரை கண்காணித்து புதுப்பிக்கிறார்கள்.",
        "status_pending_desc": "பிரச்சினை புகாரளிக்கப்பட்டு மதிப்பாய்வுக்காகக் காத்திருக்கிறது.",
        "status_progress_desc": "பிரச்சினையைச் சரிசெய்யும் பணி தொடங்கியுள்ளது.",
        "status_resolved_desc": "பிரச்சினை வெற்றிகரமாக சரிசெய்யப்பட்டது."
      },
      "issues": {
        "title": "சமூக பிரச்சினைகள்",
        "subtitle": "உங்கள் பகுதியில் உள்ள உள்கட்டமைப்பு புகார்களைப் பார்த்து ஆதரவளிக்கவும்.",
        "report_new": "புதிய பிரச்சினையைப் புகாரளிக்கவும்",
        "search_placeholder": "பிரச்சினைகளைத் தேடுங்கள்...",
        "all_categories": "அனைத்து பிரிவுகள்",
        "potholes": "குழிகள்",
        "garbage": "குப்பை",
        "streetlights": "தெருவிளக்குகள்",
        "water": "தண்ணீர்/கழிவுநீர்",
        "other": "மற்றவை",
        "status_label": "நிலை",
        "category_label": "பிரிவு",
        "sort_label": "வரிசைப்படுத்து",
        "status": {
          "all": "அனைத்து நிலைகள்",
          "pending": "நிலுவையில் உள்ளது",
          "in-progress": "செயல்பாட்டில் உள்ளது",
          "resolved": "தீர்க்கப்பட்டது",
          "rejected": "நிராகரிக்கப்பட்டது"
        },
        "sort": {
          "latest": "புதியது முதலில்",
          "votes": "அதிக வாக்குகள்",
          "priority": "முன்னுரிமை"
        },
        "no_issues": "பிரச்சினைகள் எதுவும் இல்லை",
        "no_issues_desc": "உங்கள் தேடலுக்கு ஏற்ற பிரச்சினைகள் எதுவும் இல்லை. உங்கள் சுற்றுப்புறத்தில் ஒரு பிரச்சினையைப் புகாரளிக்கும் முதல் நபராக இருங்கள்!",
        "clear_filters": "அனைத்து வடிப்பான்களையும் நீக்கு",
        "details": "விவரங்கள்",
        "by": "வழங்கியவர்",
        "anonymous": "பெயர் தெரியாதவர்"
      },
      "report": {
        "title": "ஒரு சமூகப் பிரச்சினையைப் புகாரளிக்கவும்",
        "subtitle": "நீங்கள் கண்டறிந்த பிரச்சினை பற்றிய விவரங்களை வழங்கவும்.",
        "ai_analyze": "AI பகுப்பாய்வு",
        "ai_analyzing": "AI பகுப்பாய்வு செய்கிறது...",
        "locate_me": "எனது இருப்பிடம்",
        "success_title": "பிரச்சினை புகாரளிக்கப்பட்டது!",
        "success_desc": "உங்கள் சமூகத்திற்குப் பங்களித்ததற்கு நன்றி. பிரச்சினைகள் பட்டியலுக்கு உங்களை அழைத்துச் செல்கிறோம்...",
        "error_image": "பிரச்சினையின் புகைப்படத்தைப் பதிவேற்றவும்",
        "error_location": "வரைபடத்தில் ஒரு இடத்தைத் தேர்ந்தெடுக்கவும்",
        "error_geolocation": "உங்கள் இருப்பிடத்தை அணுக முடியவில்லை. உங்கள் உலாவி அனுமதிகளைச் சரிபார்க்கவும்.",
        "error_unsupported": "உங்கள் உலாவி புவிஇருப்பிடத்தை ஆதரிக்கவில்லை.",
        "form": {
          "title_label": "பிரச்சினை தலைப்பு",
          "title_placeholder": "எ.கா., மெயின் தெருவில் பெரிய குழி",
          "desc_label": "விளக்கம்",
          "desc_placeholder": "பிரச்சினை பற்றி விரிவாக விவரிக்கவும்...",
          "category_label": "பிரிவு",
          "image_label": "புகைப்படத்தைப் பதிவேற்றவும்",
          "image_click": "புகைப்படத்தைப் பதிவேற்ற கிளிக் செய்யவும்",
          "location_label": "இருப்பிடத்தைத் தேர்ந்தெடுக்கவும்",
          "location_hint": "பிரச்சினையின் சரியான இடத்தைப் பின் செய்ய வரைபடத்தில் கிளிக் செய்யவும்.",
          "submit": "புகாரைச் சமர்ப்பிக்கவும்",
          "submitting": "சமர்ப்பிக்கப்படுகிறது..."
        }
      },
      "admin": {
        "title": "நிர்வாக டாஷ்போர்டு",
        "refresh_ai": "AI நுண்ணறிவுகளைப் புதுப்பிக்கவும்",
        "analyzing": "பகுப்பாய்வு செய்கிறது...",
        "stats": {
          "total": "மொத்தம்",
          "total_desc": "புகாரளிக்கப்பட்ட பிரச்சினைகள்",
          "pending": "நிலுவையில் உள்ளது",
          "pending_desc": "ஆய்வுக்காகக் காத்திருக்கிறது",
          "active": "செயலில் உள்ளது",
          "active_desc": "செயல்பாட்டில் உள்ளது",
          "resolved": "தீர்க்கப்பட்டது",
          "resolved_desc": "வெற்றிகரமாக சரிசெய்யப்பட்டது"
        },
        "ai_insights": "AI நகர நுண்ணறிவுகள்",
        "ai_recommendations": "AI பரிந்துரைகள்",
        "review_title": "ஆய்வுக்காகக் காத்திருக்கும் பிரச்சினைகள்",
        "view_all": "அனைத்தையும் பார்",
        "table": {
          "title": "தலைப்பு",
          "category": "பிரிவு",
          "reported_on": "புகாரளிக்கப்பட்ட தேதி",
          "votes": "வாக்குகள்",
          "action": "நடவடிக்கை",
          "no_pending": "ஆய்வு செய்ய நிலுவையில் உள்ள பிரச்சினைகள் எதுவுமில்லை. நன்று!",
          "view": "பார்",
          "approve": "அங்கீகரி",
          "reject": "நிராகரி"
        },
        "charts": {
          "category": "பிரிவு வாரியாக பிரச்சினைகள்",
          "status": "நிலை விநியோகம்"
        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
