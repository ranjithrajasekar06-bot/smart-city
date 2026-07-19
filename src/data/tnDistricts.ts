export interface NameTranslation {
  en: string;
  ta: string;
}

export interface District {
  districtName: NameTranslation;
  taluks: NameTranslation[];
}

export const TN_DISTRICTS: District[] = [
  {
    districtName: { en: "Ariyalur", ta: "அரியலூர்" },
    taluks: [
      { en: "Ariyalur", ta: "அரியலூர்" },
      { en: "Sendurai", ta: "செந்துறை" },
      { en: "Udayarpalayam", ta: "உடையார்பாளையம்" }
    ]
  },
  {
    districtName: { en: "Chengalpattu", ta: "செங்கல்பட்டு" },
    taluks: [
      { en: "Chengalpattu", ta: "செங்கல்பட்டு" },
      { en: "Maduranthakam", ta: "மதுராந்தகம்" },
      { en: "Tambaram", ta: "தாம்பரம்" },
      { en: "Tiruporur", ta: "திருப்போரூர்" }
    ]
  },
  {
    districtName: { en: "Chennai", ta: "சென்னை" },
    taluks: [
      { en: "Madhavaram", ta: "மாதவரம்" },
      { en: "Ambattur", ta: "அம்பத்தூர்" },
      { en: "Alandur", ta: "ஆலந்தூர்" },
      { en: "Egmore", ta: "எழும்பூர்" },
      { en: "Perambur", ta: "பெரம்பூர்" },
      { en: "Guindy", ta: "கிண்டி" },
      { en: "Mylapore", ta: "மயிலாப்பூர்" },
      { en: "Tondiarpet", ta: "தண்டையார்பேட்டை" },
      { en: "Velachery", ta: "வேளச்சேரி" },
      { en: "Sholinganallur", ta: "சோழிங்கநல்லூர்" }
    ]
  },
  {
    districtName: { en: "Coimbatore", ta: "கோயம்புத்தூர்" },
    taluks: [
      { en: "Coimbatore North", ta: "கோயம்புத்தூர் வடக்கு" },
      { en: "Coimbatore South", ta: "கோயம்புத்தூர் தெற்கு" },
      { en: "Mettupalayam", ta: "மேட்டுப்பாளையம்" },
      { en: "Pollachi", ta: "பொள்ளாச்சி" },
      { en: "Valparai", ta: "வால்பாறை" }
    ]
  },
  {
    districtName: { en: "Cuddalore", ta: "கடலூர்" },
    taluks: [
      { en: "Cuddalore", ta: "கடலூர்" },
      { en: "Chidambaram", ta: "சிதம்பரம்" },
      { en: "Panruti", ta: "பண்ருட்டி" },
      { en: "Vriddhachalam", ta: "விருத்தாசலம்" },
      { en: "Kurinjipadi", ta: "குறிஞ்சிப்பாடி" }
    ]
  },
  {
    districtName: { en: "Dharmapuri", ta: "தர்மபுரி" },
    taluks: [
      { en: "Dharmapuri", ta: "தர்மபுரி" },
      { en: "Harur", ta: "அரூர்" },
      { en: "Palacode", ta: "பாலக்கோடு" },
      { en: "Pennagaram", ta: "பெண்ணாகரம்" },
      { en: "Pappireddipatti", ta: "பாப்பிரெட்டிப்பட்டி" }
    ]
  },
  {
    districtName: { en: "Dindigul", ta: "திண்டுக்கல்" },
    taluks: [
      { en: "Dindigul East", ta: "திண்டுக்கல் கிழக்கு" },
      { en: "Dindigul West", ta: "திண்டுக்கல் மேற்கு" },
      { en: "Kodaikanal", ta: "கொடைக்கானல்" },
      { en: "Natham", ta: "நத்தம்" },
      { en: "Palani", ta: "பழனி" },
      { en: "Oddanchatram", ta: "ஒட்டன்சத்திரம்" }
    ]
  },
  {
    districtName: { en: "Erode", ta: "ஈரோடு" },
    taluks: [
      { en: "Erode", ta: "ஈரோடு" },
      { en: "Gobichettipalayam", ta: "கோபிசெட்டிப்பாளையம்" },
      { en: "Perundurai", ta: "பெருந்துறை" },
      { en: "Bhavani", ta: "பவானி" },
      { en: "Sathyamangalam", ta: "சத்தியமங்கலம்" }
    ]
  },
  {
    districtName: { en: "Kallakurichi", ta: "கள்ளக்குறிச்சி" },
    taluks: [
      { en: "Kallakurichi", ta: "கள்ளக்குறிச்சி" },
      { en: "Sankarapuram", ta: "சங்கராபுரம்" },
      { en: "Ulundurpet", ta: "உளுந்தூர்ப்பேட்டை" },
      { en: "Tirukkoyilur", ta: "திருக்கோவில்ூர்" }
    ]
  },
  {
    districtName: { en: "Kanchipuram", ta: "காஞ்சிபுரம்" },
    taluks: [
      { en: "Kanchipuram", ta: "காஞ்சிபுரம்" },
      { en: "Sriperumbudur", ta: "ஸ்ரீபெரும்புதூர்" },
      { en: "Uthiramerur", ta: "உத்திரமேரூர்" },
      { en: "Walajabad", ta: "வாலாஜாபாத்" }
    ]
  },
  {
    districtName: { en: "Kanyakumari", ta: "கன்னியாகுமரி" },
    taluks: [
      { en: "Agasteeswaram", ta: "அகஸ்தீஸ்வரம்" },
      { en: "Kalkulam", ta: "கல்குளம்" },
      { en: "Thovalai", ta: "தோவாளை" },
      { en: "Vilavancode", ta: "விளவங்கோடு" }
    ]
  },
  {
    districtName: { en: "Karur", ta: "கரூர்" },
    taluks: [
      { en: "Karur", ta: "கரூர்" },
      { en: "Aravakurichi", ta: "அரவக்குறிச்சி" },
      { en: "Kulithalai", ta: "குளித்தலை" },
      { en: "Krishnarayapuram", ta: "கிருஷ்ணராயபுரம்" }
    ]
  },
  {
    districtName: { en: "Krishnagiri", ta: "கிருஷ்ணகிரி" },
    taluks: [
      { en: "Krishnagiri", ta: "கிருஷ்ணகிரி" },
      { en: "Hosur", ta: "ஓசூர்" },
      { en: "Pochampalli", ta: "போச்சம்பள்ளி" },
      { en: "Uthangarai", ta: "உத்தங்கரை" },
      { en: "Denkanikottai", ta: "தேன்கனிக்கோட்டை" }
    ]
  },
  {
    districtName: { en: "Madurai", ta: "மதுரை" },
    taluks: [
      { en: "Madurai East", ta: "மதுரை கிழக்கு" },
      { en: "Madurai West", ta: "மதுரை மேற்கு" },
      { en: "Melur", ta: "மேலூர்" },
      { en: "Thirumangalam", ta: "திருமங்கலம்" },
      { en: "Usilampatti", ta: "உசிலம்பட்டி" }
    ]
  },
  {
    districtName: { en: "Mayiladuthurai", ta: "மயிலாடுதுறை" },
    taluks: [
      { en: "Mayiladuthurai", ta: "மயிலாடுதுறை" },
      { en: "Sirkazhi", ta: "சீர்காழி" },
      { en: "Tharangambadi", ta: "தரங்கம்பாடி" },
      { en: "Kuthalam", ta: "குத்தாலம்" }
    ]
  },
  {
    districtName: { en: "Nagapattinam", ta: "நாகப்பட்டினம்" },
    taluks: [
      { en: "Nagapattinam", ta: "நாகப்பட்டினம்" },
      { en: "Kilvelur", ta: "கீழ்வேளூர்" },
      { en: "Thirukkuvalai", ta: "திருக்குவளை" },
      { en: "Vedaranyam", ta: "வேதாரண்யம்" }
    ]
  },
  {
    districtName: { en: "Namakkal", ta: "நாமக்கல்" },
    taluks: [
      { en: "Namakkal", ta: "நாமக்கல்" },
      { en: "Rasipuram", ta: "ராசிபுரம்" },
      { en: "Tiruchengodu", ta: "திருச்செங்கோடு" },
      { en: "Paramathi Velur", ta: "பரமத்தி வேலூர்" },
      { en: "Kollihills", ta: "கொல்லிமலை" }
    ]
  },
  {
    districtName: { en: "Nilgiris", ta: "நீலகிரி" },
    taluks: [
      { en: "Udhagamandalam", ta: "உதகமண்டலம்" },
      { en: "Gudalur", ta: "கூடலூர்" },
      { en: "Coonoor", ta: "குன்னூர்" },
      { en: "Kotagiri", ta: "கோத்தகிரி" }
    ]
  },
  {
    districtName: { en: "Perambalur", ta: "பெரம்பலூர்" },
    taluks: [
      { en: "Perambalur", ta: "பெரம்பலூர்" },
      { en: "Kunnam", ta: "குன்னம்" },
      { en: "Veppanthattai", ta: "வேப்பந்தட்டை" },
      { en: "Alathur", ta: "ஆலத்தூர்" }
    ]
  },
  {
    districtName: { en: "Pudukkottai", ta: "புதுக்கோட்டை" },
    taluks: [
      { en: "Pudukkottai", ta: "புதுக்கோட்டை" },
      { en: "Alangudi", ta: "ஆலங்குடி" },
      { en: "Aranthangi", ta: "அறந்தாங்கி" },
      { en: "Iluppur", ta: "இலுப்பூர்" },
      { en: "Gandarvakottai", ta: "கந்தர்வகோட்டை" }
    ]
  },
  {
    districtName: { en: "Ramanathapuram", ta: "இராமநாதபுரம்" },
    taluks: [
      { en: "Ramanathapuram", ta: "இராமநாதபுரம்" },
      { en: "Rameswaram", ta: "ராமேஸ்வரம்" },
      { en: "Paramakudi", ta: "பரமக்குடி" },
      { en: "Tiruvadanai", ta: "திருவாடானை" },
      { en: "Kamuthi", ta: "கமுதி" }
    ]
  },
  {
    districtName: { en: "Ranipet", ta: "ராணிப்பேட்டை" },
    taluks: [
      { en: "Ranipet", ta: "ராணிப்பேட்டை" },
      { en: "Walajah", ta: "வாலாஜா" },
      { en: "Arakkonam", ta: "அரக்கோணம்" },
      { en: "Arcot", ta: "ஆற்காடு" }
    ]
  },
  {
    districtName: { en: "Salem", ta: "சேலம்" },
    taluks: [
      { en: "Salem", ta: "சேலம்" },
      { en: "Attur", ta: "ஆத்தூர்" },
      { en: "Mettur", ta: "மேட்டூர்" },
      { en: "Omalur", ta: "ஓமலூர்" },
      { en: "Sankari", ta: "சங்ககிரி" },
      { en: "Yercaud", ta: "ஏற்காடு" }
    ]
  },
  {
    districtName: { en: "Sivaganga", ta: "சிவகங்கை" },
    taluks: [
      { en: "Sivaganga", ta: "சிவகங்கை" },
      { en: "Karaikudi", ta: "காரைக்குடி" },
      { en: "Devakottai", ta: "தேவகோட்டை" },
      { en: "Manamadurai", ta: "மானாமதுரை" },
      { en: "Ilayangudi", ta: "இளையான்குடி" }
    ]
  },
  {
    districtName: { en: "Tenkasi", ta: "தென்காசி" },
    taluks: [
      { en: "Tenkasi", ta: "தென்காசி" },
      { en: "Sankarankovil", ta: "சங்கரன்கோவில்" },
      { en: "Kadayanallur", ta: "கடையநல்லூர்" },
      { en: "Alangulam", ta: "ஆலங்குளம்" },
      { en: "Sivagiri", ta: "சிவகிரி" }
    ]
  },
  {
    districtName: { en: "Thanjavur", ta: "தஞ்சாவூர்" },
    taluks: [
      { en: "Thanjavur", ta: "தஞ்சாவூர்" },
      { en: "Kumbakonam", ta: "கும்பகோணம்" },
      { en: "Pattukkottai", ta: "பட்டுக்கோட்டை" },
      { en: "Orathanadu", ta: "ஒரத்தநாடு" },
      { en: "Tiruvaiyaru", ta: "திருவையாறு" }
    ]
  },
  {
    districtName: { en: "Theni", ta: "தேனி" },
    taluks: [
      { en: "Theni", ta: "தேனி" },
      { en: "Bodinayakanur", ta: "போடிநாயக்கனூர்" },
      { en: "Periyakulam", ta: "பெரியகுளம்" },
      { en: "Uthamapalayam", ta: "உத்தமபாளையம்" },
      { en: "Andipatti", ta: "ஆண்டிபட்டி" }
    ]
  },
  {
    districtName: { en: "Thoothukudi", ta: "தூத்துக்குடி" },
    taluks: [
      { en: "Thoothukudi", ta: "தூத்துக்குடி" },
      { en: "Kovilpatti", ta: "கோவில்பட்டி" },
      { en: "Tiruchendur", ta: "திருச்செந்தூர்" },
      { en: "Srivaikuntam", ta: "ஸ்ரீவைகுண்டம்" },
      { en: "Vilathikulam", ta: "விளாத்திகுளம்" }
    ]
  },
  {
    districtName: { en: "Tiruchirappalli", ta: "திருச்சிராப்பள்ளி" },
    taluks: [
      { en: "Tiruchirappalli", ta: "திருச்சிராப்பள்ளி" },
      { en: "Lalgudi", ta: "லால்குடி" },
      { en: "Manapparai", ta: "மணப்பாறை" },
      { en: "Musiri", ta: "முசிறி" },
      { en: "Thuraiyur", ta: "துறையூர்" },
      { en: "Srirangam", ta: "ஸ்ரீரங்கம்" }
    ]
  },
  {
    districtName: { en: "Tirunelveli", ta: "திருநெல்வேலி" },
    taluks: [
      { en: "Tirunelveli", ta: "திருநெல்வேலி" },
      { en: "Ambasamudram", ta: "அம்பாசமுத்திரம்" },
      { en: "Nanguneri", ta: "நாங்குநேரி" },
      { en: "Radhapuram", ta: "ராதாபுரம்" },
      { en: "Palayamkottai", ta: "பாளையங்கோட்டை" }
    ]
  },
  {
    districtName: { en: "Tirupathur", ta: "திருப்பத்தூர்" },
    taluks: [
      { en: "Tirupathur", ta: "திருப்பத்தூர்" },
      { en: "Vaniyambadi", ta: "வாணியம்பாடி" },
      { en: "Ambur", ta: "ஆம்பூர்" },
      { en: "Natrampalli", ta: "நாட்டறம்பள்ளி" }
    ]
  },
  {
    districtName: { en: "Tiruppur", ta: "திருப்பூர்" },
    taluks: [
      { en: "Tiruppur", ta: "திருப்பூர்" },
      { en: "Dharapuram", ta: "தாராபுரம்" },
      { en: "Avinashi", ta: "அவினாசி" },
      { en: "Palladam", ta: "பல்லடம்" },
      { en: "Udumalaipettai", ta: "உடுமலைப்பேட்டை" }
    ]
  },
  {
    districtName: { en: "Tiruvallur", ta: "திருவள்ளூர்" },
    taluks: [
      { en: "Tiruvallur", ta: "திருவள்ளூர்" },
      { en: "Avadi", ta: "ஆவடி" },
      { en: "Ponneri", ta: "பொன்னேரி" },
      { en: "Poonamallee", ta: "பூந்தமல்லி" },
      { en: "Gummidipoondi", ta: "கும்மிடிப்பூண்டி" }
    ]
  },
  {
    districtName: { en: "Tiruvannamalai", ta: "திருவண்ணாமலை" },
    taluks: [
      { en: "Tiruvannamalai", ta: "திருவண்ணாமலை" },
      { en: "Arani", ta: "ஆரணி" },
      { en: "Chengam", ta: "செங்கம்" },
      { en: "Polur", ta: "போலூர்" },
      { en: "Vandavasi", ta: "வந்தவாசி" }
    ]
  },
  {
    districtName: { en: "Tiruvarur", ta: "திருவாரூர்" },
    taluks: [
      { en: "Tiruvarur", ta: "திருவாரூர்" },
      { en: "Mannargudi", ta: "மன்னார்குடி" },
      { en: "Nannilam", ta: "நன்னிலம்" },
      { en: "Thiruthuraipoondi", ta: "திருத்துறைப்பூண்டி" }
    ]
  },
  {
    districtName: { en: "Vellore", ta: "வேலூர்" },
    taluks: [
      { en: "Vellore", ta: "வேலூர்" },
      { en: "Gudiyatham", ta: "குடியாத்தம்" },
      { en: "Katpadi", ta: "காட்பாடி" },
      { en: "Pernambut", ta: "பேரணாம்பட்டு" }
    ]
  },
  {
    districtName: { en: "Viluppuram", ta: "விழுப்புரம்" },
    taluks: [
      { en: "Viluppuram", ta: "விழுப்புரம்" },
      { en: "Tindivanam", ta: "திண்டிவனம்" },
      { en: "Gingee", ta: "செஞ்சி" },
      { en: "Vikravandi", ta: "விக்கிரவாண்டி" },
      { en: "Vanur", ta: "வானூர்" }
    ]
  },
  {
    districtName: { en: "Virudhunagar", ta: "விருதுநகர்" },
    taluks: [
      { en: "Virudhunagar", ta: "விருதுநகர்" },
      { en: "Aruppukkottai", ta: "அருப்புக்கோட்டை" },
      { en: "Rajapalayam", ta: "ராஜபாளையம்" },
      { en: "Srivilliputhur", ta: "ஸ்ரீவில்லிபுத்தூர்" },
      { en: "Sivakasi", ta: "சிவகாசி" }
    ]
  }
];

// Helper to get translated district name
export const getTranslatedDistrict = (name: string, lang: string): string => {
  const district = TN_DISTRICTS.find(d => d.districtName.en.toLowerCase() === name.toLowerCase());
  if (district) {
    return lang === "ta" ? district.districtName.ta : district.districtName.en;
  }
  return name;
};

// Helper to get translated taluk name
export const getTranslatedTaluk = (name: string, lang: string): string => {
  for (const d of TN_DISTRICTS) {
    const taluk = d.taluks.find(t => t.en.toLowerCase() === name.toLowerCase());
    if (taluk) {
      return lang === "ta" ? taluk.ta : taluk.en;
    }
  }
  return name;
};
