// lib/i18n/LanguageContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'fr' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  translate: (text: string) => Promise<string>;
  dir: 'ltr' | 'rtl';
  isTranslating: boolean;
}

const translations = {
  en: {
    // Navigation
    'nav.home': 'Home',
    'nav.itinerary': 'Plan a Trip',
    'nav.explore': 'AI Guide',
    'nav.heritage': 'Heritage',
    'nav.sustainability': 'Eco Dashboard',
    'nav.dashboard': 'Dashboard',
    'nav.signin': 'Sign In',
    'nav.signup': 'Sign Up',

    // Hero
    'hero.title': 'Discover',
    'hero.subtitle': 'North Africa',
    'hero.description': 'Personalized itineraries, AI cultural guides, heritage recognition, and sustainable travel insights',
    'hero.cta1': 'Plan My Journey',
    'hero.cta2': 'Talk to AI Guide',
    'hero.explore': 'Scroll to explore',

    // Features
    'features.title': 'Four AI',
    'features.subtitle': 'Superpowers',
    'features.powered': 'Powered by AI',
    'features.description': 'Everything you need to explore the Maghreb intelligently and responsibly.',
    'features.explore': 'Explore',
    'features.itinerary': 'AI Itinerary Planner',
    'features.itinerary.desc': 'Personalised multi-day itineraries crafted by AI',
    'features.guide': 'AI Travel Concierge',
    'features.guide.desc': 'Chat with an expert AI trained on Tunisia and Maghreb',
    'features.heritage': 'Heritage Recognition',
    'features.heritage.desc': 'Point your camera to unlock history',
    'features.sustainability': 'Sustainability Dashboard',
    'features.sustainability.desc': 'Live crowd forecasts and eco-scores',

    // Destinations
    'destinations.featured': 'Featured Destinations',
    'destinations.places': 'Places that',
    'destinations.endure': 'Endure',
    'destinations.viewAll': 'View All Destinations',

    // Stats
    'stats.destinations': 'Destinations',
    'stats.unesco': 'UNESCO Sites',
    'stats.insights': 'AI-Powered Insights',
    'stats.languages': 'Languages',
    'stats.sustainable': 'Sustainable',

    // How it works
    'how.simple': 'Simple & Smart',
    'how.yourJourney': 'Your Journey',
    'how.reimagined': 'Reimagined',
    'how.step1.title': 'Tell us your dream',
    'how.step1.desc': 'Share your travel style, dates, budget, and interests with our AI.',
    'how.step2.title': 'AI crafts your plan',
    'how.step2.desc': 'Get a personalized itinerary with cultural context and sustainable recommendations.',
    'how.step3.title': 'Explore with confidence',
    'how.step3.desc': 'Access live crowd data, heritage info, and local insights as you travel.',

    // CTA
    'cta.welcome': 'Welcome',
    'cta.begin': 'Begin your',
    'cta.today': 'journey today',
    'cta.description': 'Join thousands of travellers discovering the Maghreb with AI.',
    'cta.createAccount': 'Create Free Account',
    'cta.tryWithout': 'Try Without Account',

    // Footer
    'footer.rights': 'All rights reserved',
    'footer.made': 'Built with',
    'footer.description': 'AI-powered travel for the Maghreb — responsible, personalized, and culturally rich.',
    'footer.explore': 'Explore',
    'footer.platform': 'Platform',
    'footer.about': 'About',

    // Error
    'error.title': 'Something went wrong',
    'error.description': 'We encountered an error. Please try again.',
    'error.reload': 'Reload Page',

    // Auth
    'auth.welcome': 'Welcome back',
    'auth.start': 'Start your journey',
    'auth.signin': 'Sign In',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.google': 'Google',
    'auth.github': 'GitHub',
    'auth.or': 'OR',
    'auth.signin.subtitle': 'Sign in to your Rihla account',
    'auth.signup.subtitle': 'Discover Tunisia & the Maghreb with AI',
    'auth.name.placeholder': 'Your name',
    'auth.email.placeholder': 'you@example.com',
    'auth.createAccount': 'Create Account',
    'auth.loading': 'Loading...',
    'auth.checkEmail': 'Check your email to confirm your account!',
    'auth.accountCreated': 'Account created! Welcome to Rihla.',
    'auth.welcomeBack': 'Marhaba! Welcome back.',
    'auth.tooManyAttempts': 'Too many attempts. Please try again later.',
    'auth.alreadyRegistered': 'This email is already registered. Please sign in instead.',
    'auth.passwordLength': 'Password must be at least 6 characters long.',
    'auth.genericError': 'Something went wrong. Please try again.',

    // Explore / AI Guide page
    'explore.focusRegion': 'Focus Region',
    'explore.quickQuestions': 'Quick Questions',
    'explore.askAbout': 'Ask About',
    'explore.aiGuide': 'Rihla AI Guide',
    'explore.expertIn': 'Expert in Tunisia & Maghreb',
    'explore.inputPlaceholder': 'Ask about destinations, food, culture, routes...',
    'explore.footerNote': 'Expert in Tunisia, Morocco, Algeria, Egypt & Jordan',
    'explore.connectionError': 'Connection error. Please try again.',
    'explore.responseError': "I couldn't respond. Please try again.",
    'explore.resetMessage': 'Chat reset! Ask me anything about your journey.',

    // Itinerary page
    'itinerary.title': 'Plan Your Perfect Journey',
    'itinerary.subtitle': 'AI-powered itineraries tailored to your style',
    'itinerary.step1': 'Choose Destination',
    'itinerary.step2': 'Travel Style',
    'itinerary.step3': 'Preferences',
    'itinerary.generate': 'Generate Itinerary',
    'itinerary.generating': 'Generating...',
    'itinerary.duration': 'Duration (days)',
    'itinerary.budget': 'Budget',
    'itinerary.interests': 'Interests',
    'itinerary.country': 'Country',
    'itinerary.style': 'Travel Style',
    'itinerary.back': 'Back',
    'itinerary.next': 'Next',
    'itinerary.yourItinerary': 'Your Itinerary',
    'itinerary.day': 'Day',
    'itinerary.tips': 'Tips',
    'itinerary.accommodation': 'Accommodation',
    'itinerary.download': 'Download',
    'itinerary.share': 'Share',
    'itinerary.regenerate': 'Regenerate',
    'itinerary.morning': 'Morning',
    'itinerary.afternoon': 'Afternoon',
    'itinerary.evening': 'Evening',
    'itinerary.ecoScore': 'Eco Score',
    'itinerary.budget.label': 'Budget',
    'itinerary.mid': 'Mid-range',
    'itinerary.luxury': 'Luxury',
    'itinerary.cultural': 'Cultural',
    'itinerary.adventure': 'Adventure',
    'itinerary.relaxation': 'Relaxation',
    'itinerary.family': 'Family',
    'itinerary.videos': 'Travel Videos',
    'itinerary.selectCountry': 'Select a destination to begin',
    'itinerary.selectStyle': 'Select your travel style',

    // Heritage page
    'heritage.title': 'Heritage Recognition',
    'heritage.subtitle': 'Discover the history behind every site',
    'heritage.describe': 'Describe a Site',
    'heritage.upload': 'Upload Image',
    'heritage.placeholder': 'Describe what you see: architecture style, materials, location details...',
    'heritage.recognize': 'Identify Site',
    'heritage.recognizing': 'Identifying...',
    'heritage.library': 'Heritage Library',
    'heritage.sampleSites': 'Sample Sites',
    'heritage.tryExample': 'Try an example',
    'heritage.period': 'Period',
    'heritage.location': 'Location',
    'heritage.visitInfo': 'Visiting Information',
    'heritage.bestTime': 'Best Time to Visit',
    'heritage.nearbyAttractions': 'Nearby Attractions',
    'heritage.historicalContext': 'Historical Context',
    'heritage.uploadHint': 'Drag & drop or click to upload an image',
    'heritage.uploadTypes': 'Supports JPG, PNG, WebP up to 10MB',
    'heritage.unesco': 'UNESCO World Heritage',
    'heritage.searchPlaceholder': 'Search heritage sites...',

    // Sustainability page
    'sustainability.title': 'Eco Dashboard',
    'sustainability.subtitle': 'Travel responsibly with real-time insights',
    'sustainability.selectDest': 'Select Destination',
    'sustainability.selectMonth': 'Select Month',
    'sustainability.getInsights': 'Get Eco Insights',
    'sustainability.loading': 'Analyzing...',
    'sustainability.crowdForecast': 'Crowd Forecast',
    'sustainability.ecoScore': 'Eco Score',
    'sustainability.waterStress': 'Water Stress',
    'sustainability.carbonFootprint': 'Carbon Footprint',
    'sustainability.recommendations': 'Recommendations',
    'sustainability.bestMonths': 'Best Months to Visit',
    'sustainability.crowdLevel': 'Crowd Level',
    'sustainability.low': 'Low',
    'sustainability.moderate': 'Moderate',
    'sustainability.high': 'High',
    'sustainability.travelTips': 'Sustainable Travel Tips',
    'sustainability.localImpact': 'Local Impact Score',
    'sustainability.carbonOffset': 'Carbon Offset',

    // Dashboard page
    'dashboard.title': 'My Dashboard',
    'dashboard.welcome': 'Welcome back',
    'dashboard.myTrips': 'My Trips',
    'dashboard.savedPlaces': 'Saved Places',
    'dashboard.ecoImpact': 'Eco Impact',
    'dashboard.signOut': 'Sign Out',
    'dashboard.noTrips': 'No trips yet. Plan your first journey!',
    'dashboard.planTrip': 'Plan a Trip',
    'dashboard.profile': 'Profile',
  },

  fr: {
    // Navigation
    'nav.home': 'Accueil',
    'nav.itinerary': 'Planifier un Voyage',
    'nav.explore': 'Guide IA',
    'nav.heritage': 'Patrimoine',
    'nav.sustainability': 'Éco-Dashboard',
    'nav.dashboard': 'Tableau de bord',
    'nav.signin': 'Connexion',
    'nav.signup': 'Inscription',

    // Hero
    'hero.title': 'Découvrez',
    'hero.subtitle': "l'Afrique du Nord",
    'hero.description': 'Itinéraires personnalisés, guides culturels IA, reconnaissance du patrimoine et conseils de voyage durable',
    'hero.cta1': 'Planifier mon Voyage',
    'hero.cta2': 'Parler au Guide IA',
    'hero.explore': 'Défiler pour explorer',

    // Features
    'features.title': 'Quatre',
    'features.subtitle': 'Superpouvoirs IA',
    'features.powered': 'Propulsé par IA',
    'features.description': 'Tout ce dont vous avez besoin pour explorer le Maghreb intelligemment et de façon responsable.',
    'features.explore': 'Explorer',
    'features.itinerary': "Planificateur d'Itinéraire IA",
    'features.itinerary.desc': 'Itinéraires personnalisés créés par IA',
    'features.guide': 'Concierge de Voyage IA',
    'features.guide.desc': 'Discutez avec un expert IA de la Tunisie et du Maghreb',
    'features.heritage': 'Reconnaissance du Patrimoine',
    'features.heritage.desc': "Pointez votre caméra pour découvrir l'histoire",
    'features.sustainability': 'Tableau de Bord Écologique',
    'features.sustainability.desc': 'Prévisions de foule et éco-scores en direct',

    // Destinations
    'destinations.featured': 'Destinations Vedettes',
    'destinations.places': 'Des lieux qui',
    'destinations.endure': 'Perdurent',
    'destinations.viewAll': 'Voir Toutes les Destinations',

    // Stats
    'stats.destinations': 'Destinations',
    'stats.unesco': 'Sites UNESCO',
    'stats.insights': 'Analyses IA',
    'stats.languages': 'Langues',
    'stats.sustainable': 'Durable',

    // How it works
    'how.simple': 'Simple & Intelligent',
    'how.yourJourney': 'Votre Voyage',
    'how.reimagined': 'Réinventé',
    'how.step1.title': 'Partagez votre rêve',
    'how.step1.desc': "Indiquez votre style de voyage, vos dates, votre budget et vos intérêts à notre IA.",
    'how.step2.title': "L'IA crée votre plan",
    'how.step2.desc': 'Obtenez un itinéraire personnalisé avec contexte culturel et recommandations durables.',
    'how.step3.title': 'Explorez en confiance',
    'how.step3.desc': 'Accédez aux données de foule en direct, aux infos patrimoniales et aux conseils locaux.',

    // CTA
    'cta.welcome': 'Bienvenue',
    'cta.begin': 'Commencez votre',
    'cta.today': "voyage aujourd'hui",
    'cta.description': "Rejoignez des milliers de voyageurs qui découvrent le Maghreb avec l'IA.",
    'cta.createAccount': 'Créer un Compte Gratuit',
    'cta.tryWithout': 'Essayer Sans Compte',

    // Footer
    'footer.rights': 'Tous droits réservés',
    'footer.made': 'Construit avec',
    'footer.description': "Voyage IA pour le Maghreb — responsable, personnalisé et culturellement riche.",
    'footer.explore': 'Explorer',
    'footer.platform': 'Plateforme',
    'footer.about': 'À propos',

    // Error
    'error.title': 'Une erreur est survenue',
    'error.description': 'Nous avons rencontré une erreur. Veuillez réessayer.',
    'error.reload': 'Recharger la page',

    // Auth
    'auth.welcome': 'Bon retour',
    'auth.start': 'Commencez votre voyage',
    'auth.signin': 'Se connecter',
    'auth.signup': "S'inscrire",
    'auth.email': 'Email',
    'auth.password': 'Mot de passe',
    'auth.name': 'Nom complet',
    'auth.google': 'Google',
    'auth.github': 'GitHub',
    'auth.or': 'OU',
    'auth.signin.subtitle': 'Connectez-vous à votre compte Rihla',
    'auth.signup.subtitle': "Découvrez la Tunisie et le Maghreb avec l'IA",
    'auth.name.placeholder': 'Votre nom',
    'auth.email.placeholder': 'vous@exemple.com',
    'auth.createAccount': 'Créer un compte',
    'auth.loading': 'Chargement...',
    'auth.checkEmail': 'Vérifiez votre email pour confirmer votre compte !',
    'auth.accountCreated': 'Compte créé ! Bienvenue sur Rihla.',
    'auth.welcomeBack': 'Marhaba ! Bon retour.',
    'auth.tooManyAttempts': 'Trop de tentatives. Veuillez réessayer plus tard.',
    'auth.alreadyRegistered': 'Cet email est déjà enregistré. Veuillez vous connecter.',
    'auth.passwordLength': 'Le mot de passe doit comporter au moins 6 caractères.',
    'auth.genericError': 'Une erreur est survenue. Veuillez réessayer.',

    // Explore / AI Guide page
    'explore.focusRegion': 'Région Focus',
    'explore.quickQuestions': 'Questions Rapides',
    'explore.askAbout': 'À Propos De',
    'explore.aiGuide': 'Guide IA Rihla',
    'explore.expertIn': 'Expert en Tunisie et Maghreb',
    'explore.inputPlaceholder': 'Posez des questions sur les destinations, la nourriture, la culture...',
    'explore.footerNote': 'Expert en Tunisie, Maroc, Algérie, Égypte et Jordanie',
    'explore.connectionError': 'Erreur de connexion. Veuillez réessayer.',
    'explore.responseError': "Je n'ai pas pu répondre. Veuillez réessayer.",
    'explore.resetMessage': "Chat réinitialisé ! Posez-moi n'importe quelle question sur votre voyage.",

    // Itinerary page
    'itinerary.title': 'Planifiez Votre Voyage Parfait',
    'itinerary.subtitle': 'Itinéraires IA adaptés à votre style',
    'itinerary.step1': 'Choisir la Destination',
    'itinerary.step2': 'Style de Voyage',
    'itinerary.step3': 'Préférences',
    'itinerary.generate': "Générer l'Itinéraire",
    'itinerary.generating': 'Génération...',
    'itinerary.duration': 'Durée (jours)',
    'itinerary.budget': 'Budget',
    'itinerary.interests': 'Intérêts',
    'itinerary.country': 'Pays',
    'itinerary.style': 'Style de Voyage',
    'itinerary.back': 'Retour',
    'itinerary.next': 'Suivant',
    'itinerary.yourItinerary': 'Votre Itinéraire',
    'itinerary.day': 'Jour',
    'itinerary.tips': 'Conseils',
    'itinerary.accommodation': 'Hébergement',
    'itinerary.download': 'Télécharger',
    'itinerary.share': 'Partager',
    'itinerary.regenerate': 'Régénérer',
    'itinerary.morning': 'Matin',
    'itinerary.afternoon': 'Après-midi',
    'itinerary.evening': 'Soir',
    'itinerary.ecoScore': 'Score Éco',
    'itinerary.budget.label': 'Budget',
    'itinerary.mid': 'Moyen',
    'itinerary.luxury': 'Luxe',
    'itinerary.cultural': 'Culturel',
    'itinerary.adventure': 'Aventure',
    'itinerary.relaxation': 'Détente',
    'itinerary.family': 'Famille',
    'itinerary.videos': 'Vidéos de Voyage',
    'itinerary.selectCountry': 'Sélectionnez une destination pour commencer',
    'itinerary.selectStyle': 'Sélectionnez votre style de voyage',

    // Heritage page
    'heritage.title': 'Reconnaissance du Patrimoine',
    'heritage.subtitle': "Découvrez l'histoire derrière chaque site",
    'heritage.describe': 'Décrire un Site',
    'heritage.upload': 'Télécharger une Image',
    'heritage.placeholder': 'Décrivez ce que vous voyez : style architectural, matériaux, détails du lieu...',
    'heritage.recognize': 'Identifier le Site',
    'heritage.recognizing': 'Identification...',
    'heritage.library': 'Bibliothèque Patrimoniale',
    'heritage.sampleSites': 'Sites Exemples',
    'heritage.tryExample': 'Essayer un exemple',
    'heritage.period': 'Période',
    'heritage.location': 'Lieu',
    'heritage.visitInfo': 'Informations de Visite',
    'heritage.bestTime': 'Meilleure Période',
    'heritage.nearbyAttractions': 'Attractions Proches',
    'heritage.historicalContext': 'Contexte Historique',
    'heritage.uploadHint': "Glissez-déposez ou cliquez pour télécharger une image",
    'heritage.uploadTypes': "Formats JPG, PNG, WebP jusqu'à 10 Mo",
    'heritage.unesco': 'Patrimoine Mondial UNESCO',
    'heritage.searchPlaceholder': 'Rechercher des sites patrimoniaux...',

    // Sustainability page
    'sustainability.title': 'Tableau de Bord Écologique',
    'sustainability.subtitle': 'Voyagez de façon responsable avec des données en temps réel',
    'sustainability.selectDest': 'Sélectionner la Destination',
    'sustainability.selectMonth': 'Sélectionner le Mois',
    'sustainability.getInsights': 'Obtenir des Analyses Éco',
    'sustainability.loading': 'Analyse en cours...',
    'sustainability.crowdForecast': 'Prévisions de Foule',
    'sustainability.ecoScore': 'Score Éco',
    'sustainability.waterStress': 'Stress Hydrique',
    'sustainability.carbonFootprint': 'Empreinte Carbone',
    'sustainability.recommendations': 'Recommandations',
    'sustainability.bestMonths': 'Meilleurs Mois',
    'sustainability.crowdLevel': 'Niveau de Foule',
    'sustainability.low': 'Faible',
    'sustainability.moderate': 'Modéré',
    'sustainability.high': 'Élevé',
    'sustainability.travelTips': 'Conseils de Voyage Durable',
    'sustainability.localImpact': 'Impact Local',
    'sustainability.carbonOffset': 'Compensation Carbone',

    // Dashboard page
    'dashboard.title': 'Mon Tableau de Bord',
    'dashboard.welcome': 'Bon retour',
    'dashboard.myTrips': 'Mes Voyages',
    'dashboard.savedPlaces': 'Lieux Enregistrés',
    'dashboard.ecoImpact': 'Impact Éco',
    'dashboard.signOut': 'Se déconnecter',
    'dashboard.noTrips': "Aucun voyage pour l'instant. Planifiez votre premier voyage !",
    'dashboard.planTrip': 'Planifier un Voyage',
    'dashboard.profile': 'Profil',
  },

  ar: {
    // Navigation
    'nav.home': 'الرئيسية',
    'nav.itinerary': 'خطط لرحلة',
    'nav.explore': 'دليل الذكاء الاصطناعي',
    'nav.heritage': 'التراث',
    'nav.sustainability': 'لوحة الاستدامة',
    'nav.dashboard': 'لوحة التحكم',
    'nav.signin': 'تسجيل الدخول',
    'nav.signup': 'إنشاء حساب',

    // Hero
    'hero.title': 'اكتشف',
    'hero.subtitle': 'شمال أفريقيا',
    'hero.description': 'مسارات مخصصة، أدلة ثقافية بالذكاء الاصطناعي، التعرف على التراث ونصائح السفر المستدام',
    'hero.cta1': 'خطط لرحلتي',
    'hero.cta2': 'تحدث مع الدليل',
    'hero.explore': 'انقر للاستكشاف',

    // Features
    'features.title': 'أربع قدرات',
    'features.subtitle': 'خارقة بالذكاء الاصطناعي',
    'features.powered': 'مدعوم بالذكاء الاصطناعي',
    'features.description': 'كل ما تحتاجه لاستكشاف المغرب العربي بذكاء ومسؤولية.',
    'features.explore': 'استكشف',
    'features.itinerary': 'مخطط الرحلات بالذكاء الاصطناعي',
    'features.itinerary.desc': 'مسارات مخصصة لعدة أيام من إعداد الذكاء الاصطناعي',
    'features.guide': 'مرشد السفر بالذكاء الاصطناعي',
    'features.guide.desc': 'تحدث مع خبير ذكاء اصطناعي في تونس والمغرب العربي',
    'features.heritage': 'التعرف على التراث',
    'features.heritage.desc': 'صور بالكاميرا لاكتشاف التاريخ',
    'features.sustainability': 'لوحة الاستدامة',
    'features.sustainability.desc': 'توقعات الازدحام والدرجات البيئية المباشرة',

    // Destinations
    'destinations.featured': 'وجهات مميزة',
    'destinations.places': 'أماكن',
    'destinations.endure': 'تدوم',
    'destinations.viewAll': 'عرض جميع الوجهات',

    // Stats
    'stats.destinations': 'وجهة',
    'stats.unesco': 'مواقع يونسكو',
    'stats.insights': 'تحليلات ذكاء اصطناعي',
    'stats.languages': 'لغات',
    'stats.sustainable': 'مستدام',

    // How it works
    'how.simple': 'بسيط وذكي',
    'how.yourJourney': 'رحلتك',
    'how.reimagined': 'من جديد',
    'how.step1.title': 'أخبرنا بحلمك',
    'how.step1.desc': 'شارك أسلوب سفرك وتواريخك وميزانيتك واهتماماتك مع الذكاء الاصطناعي.',
    'how.step2.title': 'الذكاء الاصطناعي يصمم خطتك',
    'how.step2.desc': 'احصل على مسار مخصص مع السياق الثقافي والتوصيات المستدامة.',
    'how.step3.title': 'استكشف بثقة',
    'how.step3.desc': 'تصفح بيانات الازدحام الحية ومعلومات التراث والنصائح المحلية أثناء السفر.',

    // CTA
    'cta.welcome': 'أهلاً',
    'cta.begin': 'ابدأ',
    'cta.today': 'رحلتك اليوم',
    'cta.description': 'انضم لآلاف المسافرين يكتشفون المغرب العربي مع الذكاء الاصطناعي.',
    'cta.createAccount': 'إنشاء حساب مجاني',
    'cta.tryWithout': 'جرّب بدون حساب',

    // Footer
    'footer.rights': 'جميع الحقوق محفوظة',
    'footer.made': 'بني بـ',
    'footer.description': 'سفر ذكي للمغرب العربي — مسؤول، مخصص وغني ثقافياً.',
    'footer.explore': 'استكشف',
    'footer.platform': 'المنصة',
    'footer.about': 'حول',

    // Error
    'error.title': 'حدث خطأ ما',
    'error.description': 'واجهنا خطأً. يرجى المحاولة مرة أخرى.',
    'error.reload': 'إعادة تحميل الصفحة',

    // Auth
    'auth.welcome': 'مرحباً بعودتك',
    'auth.start': 'ابدأ رحلتك',
    'auth.signin': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.name': 'الاسم الكامل',
    'auth.google': 'جوجل',
    'auth.github': 'جيثب',
    'auth.or': 'أو',
    'auth.signin.subtitle': 'سجّل الدخول إلى حسابك في رحلة',
    'auth.signup.subtitle': 'اكتشف تونس والمغرب العربي مع الذكاء الاصطناعي',
    'auth.name.placeholder': 'اسمك',
    'auth.email.placeholder': 'بريدك@مثال.com',
    'auth.createAccount': 'إنشاء حساب',
    'auth.loading': 'جارٍ التحميل...',
    'auth.checkEmail': 'تحقق من بريدك الإلكتروني لتأكيد حسابك!',
    'auth.accountCreated': 'تم إنشاء الحساب! مرحباً بك في رحلة.',
    'auth.welcomeBack': 'مرحباً! أهلاً بعودتك.',
    'auth.tooManyAttempts': 'محاولات كثيرة جداً. يرجى المحاولة لاحقاً.',
    'auth.alreadyRegistered': 'هذا البريد مسجّل مسبقاً. يرجى تسجيل الدخول.',
    'auth.passwordLength': 'يجب أن تتكون كلمة المرور من 6 أحرف على الأقل.',
    'auth.genericError': 'حدث خطأ ما. يرجى المحاولة مرة أخرى.',

    // Explore / AI Guide page
    'explore.focusRegion': 'المنطقة المحددة',
    'explore.quickQuestions': 'أسئلة سريعة',
    'explore.askAbout': 'اسأل عن',
    'explore.aiGuide': 'دليل رحلة الذكاء الاصطناعي',
    'explore.expertIn': 'خبير في تونس والمغرب العربي',
    'explore.inputPlaceholder': 'اسأل عن الوجهات والطعام والثقافة والمسارات...',
    'explore.footerNote': 'خبير في تونس والمغرب والجزائر ومصر والأردن',
    'explore.connectionError': 'خطأ في الاتصال. يرجى المحاولة مرة أخرى.',
    'explore.responseError': 'لم أتمكن من الرد. يرجى المحاولة مرة أخرى.',
    'explore.resetMessage': 'تمت إعادة ضبط الدردشة! اسألني أي شيء عن رحلتك.',

    // Itinerary page
    'itinerary.title': 'خطط لرحلتك المثالية',
    'itinerary.subtitle': 'مسارات ذكاء اصطناعي مصممة لأسلوبك',
    'itinerary.step1': 'اختر الوجهة',
    'itinerary.step2': 'أسلوب السفر',
    'itinerary.step3': 'التفضيلات',
    'itinerary.generate': 'إنشاء المسار',
    'itinerary.generating': 'جارٍ الإنشاء...',
    'itinerary.duration': 'المدة (أيام)',
    'itinerary.budget': 'الميزانية',
    'itinerary.interests': 'الاهتمامات',
    'itinerary.country': 'الدولة',
    'itinerary.style': 'أسلوب السفر',
    'itinerary.back': 'رجوع',
    'itinerary.next': 'التالي',
    'itinerary.yourItinerary': 'مسارك السياحي',
    'itinerary.day': 'اليوم',
    'itinerary.tips': 'نصائح',
    'itinerary.accommodation': 'الإقامة',
    'itinerary.download': 'تنزيل',
    'itinerary.share': 'مشاركة',
    'itinerary.regenerate': 'إعادة الإنشاء',
    'itinerary.morning': 'الصباح',
    'itinerary.afternoon': 'بعد الظهر',
    'itinerary.evening': 'المساء',
    'itinerary.ecoScore': 'الدرجة البيئية',
    'itinerary.budget.label': 'اقتصادي',
    'itinerary.mid': 'متوسط',
    'itinerary.luxury': 'فاخر',
    'itinerary.cultural': 'ثقافي',
    'itinerary.adventure': 'مغامرة',
    'itinerary.relaxation': 'استرخاء',
    'itinerary.family': 'عائلة',
    'itinerary.videos': 'مقاطع فيديو السفر',
    'itinerary.selectCountry': 'اختر وجهة للبدء',
    'itinerary.selectStyle': 'اختر أسلوب سفرك',

    // Heritage page
    'heritage.title': 'التعرف على التراث',
    'heritage.subtitle': 'اكتشف التاريخ وراء كل موقع',
    'heritage.describe': 'وصف موقع',
    'heritage.upload': 'رفع صورة',
    'heritage.placeholder': 'صف ما تراه: الطراز المعماري، المواد، تفاصيل الموقع...',
    'heritage.recognize': 'تحديد الموقع',
    'heritage.recognizing': 'جارٍ التحديد...',
    'heritage.library': 'مكتبة التراث',
    'heritage.sampleSites': 'مواقع نموذجية',
    'heritage.tryExample': 'جرّب مثالاً',
    'heritage.period': 'الحقبة',
    'heritage.location': 'الموقع',
    'heritage.visitInfo': 'معلومات الزيارة',
    'heritage.bestTime': 'أفضل وقت للزيارة',
    'heritage.nearbyAttractions': 'معالم قريبة',
    'heritage.historicalContext': 'السياق التاريخي',
    'heritage.uploadHint': 'اسحب وأفلت أو انقر لرفع صورة',
    'heritage.uploadTypes': 'يدعم JPG و PNG و WebP حتى 10 ميجابايت',
    'heritage.unesco': 'موروث عالمي يونسكو',
    'heritage.searchPlaceholder': 'البحث في مواقع التراث...',

    // Sustainability page
    'sustainability.title': 'لوحة الاستدامة',
    'sustainability.subtitle': 'سافر بمسؤولية مع رؤى في الوقت الفعلي',
    'sustainability.selectDest': 'اختر الوجهة',
    'sustainability.selectMonth': 'اختر الشهر',
    'sustainability.getInsights': 'احصل على تحليلات بيئية',
    'sustainability.loading': 'جارٍ التحليل...',
    'sustainability.crowdForecast': 'توقع الازدحام',
    'sustainability.ecoScore': 'الدرجة البيئية',
    'sustainability.waterStress': 'ضغط المياه',
    'sustainability.carbonFootprint': 'البصمة الكربونية',
    'sustainability.recommendations': 'التوصيات',
    'sustainability.bestMonths': 'أفضل الأشهر',
    'sustainability.crowdLevel': 'مستوى الازدحام',
    'sustainability.low': 'منخفض',
    'sustainability.moderate': 'معتدل',
    'sustainability.high': 'مرتفع',
    'sustainability.travelTips': 'نصائح السفر المستدام',
    'sustainability.localImpact': 'الأثر المحلي',
    'sustainability.carbonOffset': 'تعويض الكربون',

    // Dashboard page
    'dashboard.title': 'لوحتي',
    'dashboard.welcome': 'مرحباً بعودتك',
    'dashboard.myTrips': 'رحلاتي',
    'dashboard.savedPlaces': 'الأماكن المحفوظة',
    'dashboard.ecoImpact': 'الأثر البيئي',
    'dashboard.signOut': 'تسجيل الخروج',
    'dashboard.noTrips': 'لا رحلات بعد. خطط لأول رحلة!',
    'dashboard.planTrip': 'خطط لرحلة',
    'dashboard.profile': 'الملف الشخصي',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');
  const [dir, setDir] = useState<'ltr' | 'rtl'>('ltr');
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem('language') as Language;
    if (savedLang && ['en', 'fr', 'ar'].includes(savedLang)) {
      setLanguage(savedLang);
      setDir(savedLang === 'ar' ? 'rtl' : 'ltr');
    } else {
      const browserLang = navigator.language.split('-')[0];
      if (browserLang === 'fr') {
        setLanguage('fr');
      } else if (browserLang === 'ar') {
        setLanguage('ar');
        setDir('rtl');
      } else {
        setLanguage('en');
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('language', language);
    setDir(language === 'ar' ? 'rtl' : 'ltr');
    document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    const staticTranslation = translations[language]?.[key as keyof typeof translations.en];
    if (staticTranslation) return staticTranslation;
    return translations.en[key as keyof typeof translations.en] || key;
  };

  const translate = async (text: string): Promise<string> => {
    if (!text || language === 'en') return text;
    setIsTranslating(true);
    try {
      const response = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang: language })
      });
      const data = await response.json();
      return data.translatedText || text;
    } catch (error) {
      console.error('Translation error:', error);
      return text;
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translate, dir, isTranslating }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
