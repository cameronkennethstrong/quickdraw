import { createRouter, createWebHistory } from 'vue-router';

import wwPage from './views/wwPage.vue';

import { initializeData, initializePlugins, onPageUnload } from '@/_common/helpers/data';

let router;
const routes = [];

function scrollBehavior(to) {
    if (to.hash) {
        return {
            el: to.hash,
            behavior: 'smooth',
        };
    } else {
        return { top: 0 };
    }
}

 
/* wwFront:start */
import pluginsSettings from '../../plugins-settings.json';

// eslint-disable-next-line no-undef
window.wwg_designInfo = {"id":"d1290f08-7a4d-4a90-8636-518e74fcc474","homePageId":"fe812bf2-3ece-4ce5-9c01-ad10652daaea","authPluginId":null,"baseTag":null,"defaultTheme":"light","langs":[{"lang":"en","default":true}],"background":{},"workflows":[],"pages":[{"id":"fe812bf2-3ece-4ce5-9c01-ad10652daaea","linkId":"fe812bf2-3ece-4ce5-9c01-ad10652daaea","name":"Home","folder":null,"paths":{"en":"home","default":"home"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"e0ae4b65-4b99-4c91-a8ec-f1fee286c206","sectionTitle":"Section","linkId":"435aa91b-a393-4dc2-a183-baab0769d32a"}],"pageUserGroups":[],"title":{"en":"","fr":"Vide | Commencer à partir de zéro"},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"5e9ab10a-b968-45a6-b8fe-a1cda3998cc4","linkId":"5e9ab10a-b968-45a6-b8fe-a1cda3998cc4","name":"Draw","folder":null,"paths":{"en":"draw","default":"draw"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"ef37c41f-f575-40c6-bf06-285a79a2f303","sectionTitle":"Section","linkId":"f1d02508-c037-4739-92c8-e7f12e563460"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"f564b791-6b71-48a7-adfc-0ee04d0bc2ed","linkId":"f564b791-6b71-48a7-adfc-0ee04d0bc2ed","name":"Pending Project","folder":null,"paths":{"en":"pending-project","default":"pending-project"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"5f9ebdf0-0530-46e7-aa44-0a6fcd05a39c","sectionTitle":"Section","linkId":"ef8d93ca-6125-4a0b-8dda-13e6141ab393"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"3d780dee-05f9-4d08-ba03-c45c507d9915","linkId":"3d780dee-05f9-4d08-ba03-c45c507d9915","name":"Take Photo","folder":null,"paths":{"en":"take-photo","default":"take-photo"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"c71d76c6-d8d5-4f88-9433-ac50bbbf897b","sectionTitle":"Section","linkId":"6d8a626d-a2ee-4261-b676-da5872fd3937"},{"uid":"22373756-064c-41f6-9890-013aba76fb4b","sectionTitle":"Section","linkId":"befdb4b9-b21d-404b-899f-0c485c8c4504"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"24488923-76f9-43be-a9f1-0c4acb650178","linkId":"24488923-76f9-43be-a9f1-0c4acb650178","name":"Photos","folder":null,"paths":{"en":"photos","default":"photos"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"ae3af34d-7086-4eee-a5b4-c5e284ad75f6","sectionTitle":"Section","linkId":"633e25a8-9449-422c-8c6b-4803731915e6"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"f69f172b-99b8-412f-8b5a-7ee0042e85f5","linkId":"f69f172b-99b8-412f-8b5a-7ee0042e85f5","name":"Active Project","folder":null,"paths":{"en":"active-project","default":"active-project"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"7a3fbbbb-e2c4-4f6a-a885-64e848bb56d2","sectionTitle":"Section","linkId":"9b0e317a-6258-4b87-8f50-fc5ad639e4f1"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""},{"id":"ea68e3d0-e3ff-4d59-af29-f8762514af3a","linkId":"ea68e3d0-e3ff-4d59-af29-f8762514af3a","name":"Approval","folder":null,"paths":{"en":"approve","default":"approve"},"langs":["en"],"cmsDataSetPath":null,"sections":[{"uid":"ef7b02bf-7322-4f77-876d-d4fb3e10b064","sectionTitle":"Section","linkId":"c71d915e-94ba-4d8a-883c-da795599c23a"}],"pageUserGroups":[],"title":{},"meta":{"desc":{},"keywords":{},"socialDesc":{},"socialTitle":{},"structuredData":{}},"metaImage":""}],"plugins":[{"id":"2adce8d5-2056-479d-a21a-068f55a8077f","name":"Mapbox","namespace":"mapbox"},{"id":"2bd1c688-31c5-443e-ae25-59aa5b6431fb","name":"REST API","namespace":"restApi"}]};
// eslint-disable-next-line no-undef
window.wwg_cacheVersion = 74;
// eslint-disable-next-line no-undef
window.wwg_pluginsSettings = pluginsSettings;
// eslint-disable-next-line no-undef
window.wwg_disableManifest = false;

const defaultLang = window.wwg_designInfo.langs.find(({ default: isDefault }) => isDefault) || {};

const registerRoute = (page, lang, forcedPath) => {
    const langSlug = !lang.default || lang.isDefaultPath ? `/${lang.lang}` : '';
    let path =
        forcedPath ||
        (page.id === window.wwg_designInfo.homePageId ? '/' : `/${page.paths[lang.lang] || page.paths.default}`);

    //Replace params
    path = path.replace(/{{([\w]+)\|([^/]+)?}}/g, ':$1');

    routes.push({
        path: langSlug + path,
        component: wwPage,
        name: `page-${page.id}-${lang.lang}`,
        meta: {
            pageId: page.id,
            lang,
            isPrivate: !!page.pageUserGroups?.length,
        },
        async beforeEnter(to, from) {
            if (to.name === from.name) return;
            //Set page lang
            wwLib.wwLang.defaultLang = defaultLang.lang;
            wwLib.$store.dispatch('front/setLang', lang.lang);

            //Init plugins
            await initializePlugins();

            //Check if private page
            if (page.pageUserGroups?.length) {
                // cancel navigation if no plugin
                if (!wwLib.wwAuth.plugin) {
                    return false;
                }

                await wwLib.wwAuth.init();

                // Redirect to not sign in page if not logged
                if (!wwLib.wwAuth.getIsAuthenticated()) {
                    window.location.href = `${wwLib.wwPageHelper.getPagePath(
                        wwLib.wwAuth.getUnauthenticatedPageId()
                    )}?_source=${to.path}`;

                    return null;
                }

                //Check roles are required
                if (
                    page.pageUserGroups.length > 1 &&
                    !wwLib.wwAuth.matchUserGroups(page.pageUserGroups.map(({ userGroup }) => userGroup))
                ) {
                    window.location.href = `${wwLib.wwPageHelper.getPagePath(
                        wwLib.wwAuth.getUnauthorizedPageId()
                    )}?_source=${to.path}`;

                    return null;
                }
            }

            try {
                await import(`@/pages/${page.id.split('_')[0]}.js`);
                await wwLib.wwWebsiteData.fetchPage(page.id);

                //Scroll to section or on top after page change
                if (to.hash) {
                    const targetElement = document.getElementById(to.hash.replace('#', ''));
                    if (targetElement) targetElement.scrollIntoView();
                } else {
                    document.body.scrollTop = document.documentElement.scrollTop = 0;
                }

                return;
            } catch (err) {
                wwLib.$store.dispatch('front/showPageLoadProgress', false);

                if (err.redirectUrl) {
                    return { path: err.redirectUrl || '404' };
                } else {
                    //Any other error: go to target page using window.location
                    window.location = to.fullPath;
                }
            }
        },
    });
};

for (const page of window.wwg_designInfo.pages) {
    for (const lang of window.wwg_designInfo.langs) {
        if (!page.langs.includes(lang.lang)) continue;
        registerRoute(page, lang);
    }
}

const page404 = window.wwg_designInfo.pages.find(page => page.paths.default === '404');
if (page404) {
    for (const lang of window.wwg_designInfo.langs) {
        // Create routes /:lang/:pathMatch(.*)* etc for all langs of the 404 page
        if (!page404.langs.includes(lang.lang)) continue;
        registerRoute(
            page404,
            {
                default: false,
                lang: lang.lang,
            },
            '/:pathMatch(.*)*'
        );
    }
    // Create route /:pathMatch(.*)* using default project lang
    registerRoute(page404, { default: true, isDefaultPath: false, lang: defaultLang.lang }, '/:pathMatch(.*)*');
} else {
    routes.push({
        path: '/:pathMatch(.*)*',
        async beforeEnter() {
            window.location.href = '/404';
        },
    });
}

let routerOptions = {};

const isProd =
    !window.location.host.includes(
        // TODO: add staging2 ?
        '-staging.' + (process.env.WW_ENV === 'staging' ? import.meta.env.VITE_APP_PREVIEW_URL : '')
    ) && !window.location.host.includes(import.meta.env.VITE_APP_PREVIEW_URL);

if (isProd && window.wwg_designInfo.baseTag?.href) {
    let baseTag = window.wwg_designInfo.baseTag.href;
    if (!baseTag.startsWith('/')) {
        baseTag = '/' + baseTag;
    }
    if (!baseTag.endsWith('/')) {
        baseTag += '/';
    }

    routerOptions = {
        base: baseTag,
        history: createWebHistory(baseTag),
        routes,
    };
} else {
    routerOptions = {
        history: createWebHistory(),
        routes,
    };
}

router = createRouter({
    ...routerOptions,
    scrollBehavior,
});

//Trigger on page unload
let isFirstNavigation = true;
router.beforeEach(async (to, from) => {
    if (to.name === from.name) return;
    if (!isFirstNavigation) await onPageUnload();
    isFirstNavigation = false;
    wwLib.globalVariables._navigationId++;
    return;
});

//Init page
router.afterEach((to, from, failure) => {
    wwLib.$store.dispatch('front/showPageLoadProgress', false);
    let fromPath = from.path;
    let toPath = to.path;
    if (!fromPath.endsWith('/')) fromPath = fromPath + '/';
    if (!toPath.endsWith('/')) toPath = toPath + '/';
    if (failure || (from.name && toPath === fromPath)) return;
    initializeData(to);
});
/* wwFront:end */

export default router;
