/**
 * Next.js Internationalization Blueprint
 * 
 * Sets up complete next-intl integration with advanced features
 * Includes pluralization, rich text, dynamic imports, and more
 */

import { Blueprint } from '../../../types/adapter.js';

export const nextIntlBlueprint: Blueprint = {
  id: 'next-intl-base-setup',
  name: 'Next.js Internationalization Base Setup',
  actions: [
    {
      type: 'INSTALL_PACKAGES',
      packages: ['next-intl']
    },
    {
      type: 'CREATE_FILE',
      path: 'src/i18n/request.ts',
      content: `import {getRequestConfig} from 'next-intl/server';

export default getRequestConfig(async ({requestLocale}) => {
  // This typically corresponds to the \`[locale]\` segment
  let locale = await requestLocale;

  // Ensure that a valid locale is used
  const supportedLocales = {{module.parameters.locales}};
  const defaultLocale = '{{module.parameters.defaultLocale}}';
  
  if (!locale || !supportedLocales.includes(locale as string)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(\`../messages/\${locale}.json\`)).default
  };
});`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/messages/en.json',
      content: `{
  "common": {
    "welcome": "Welcome to {{project.name}}",
    "loading": "Loading...",
    "error": "An error occurred",
    "success": "Success!",
    "cancel": "Cancel",
    "save": "Save",
    "delete": "Delete",
    "edit": "Edit",
    "create": "Create",
    "search": "Search",
    "filter": "Filter",
    "sort": "Sort",
    "next": "Next",
    "previous": "Previous",
    "submit": "Submit",
    "reset": "Reset",
    "close": "Close",
    "open": "Open",
    "yes": "Yes",
    "no": "No",
    "confirm": "Confirm",
    "back": "Back",
    "continue": "Continue",
    "finish": "Finish"
  },
  "navigation": {
    "home": "Home",
    "about": "About",
    "contact": "Contact",
    "pricing": "Pricing",
    "blog": "Blog",
    "products": "Products",
    "dashboard": "Dashboard",
    "profile": "Profile",
    "settings": "Settings",
    "logout": "Logout",
    "login": "Login",
    "register": "Register"
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'src/messages/fr.json',
      content: `{
  "common": {
    "welcome": "Bienvenue sur {{project.name}}",
    "loading": "Chargement...",
    "error": "Une erreur s'est produite",
    "success": "Succès !",
    "cancel": "Annuler",
    "save": "Enregistrer",
    "delete": "Supprimer",
    "edit": "Modifier",
    "create": "Créer",
    "search": "Rechercher",
    "filter": "Filtrer",
    "sort": "Trier",
    "next": "Suivant",
    "previous": "Précédent",
    "submit": "Soumettre",
    "reset": "Réinitialiser",
    "close": "Fermer",
    "open": "Ouvrir",
    "yes": "Oui",
    "no": "Non",
    "confirm": "Confirmer",
    "back": "Retour",
    "continue": "Continuer",
    "finish": "Terminer"
  },
  "navigation": {
    "home": "Accueil",
    "about": "À propos",
    "contact": "Contact",
    "pricing": "Tarifs",
    "blog": "Blog",
    "products": "Produits",
    "dashboard": "Tableau de bord",
    "profile": "Profil",
    "settings": "Paramètres",
    "logout": "Déconnexion",
    "login": "Connexion",
    "register": "S'inscrire"
  }
}`
    },
    {
      type: 'CREATE_FILE',
      path: 'next.config.ts',
      content: `import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@sentry/nextjs'],
};

export default withNextIntl(nextConfig);`
    }
  ]
};
