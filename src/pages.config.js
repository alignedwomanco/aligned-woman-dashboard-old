import Landing from './pages/Landing';
import OurWhy from './pages/OurWhy';
import ALIVEMethod from './pages/ALIVEMethod';
import Experts from './pages/Experts';
import Apply from './pages/Apply';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import OnboardingDiagnostic from './pages/OnboardingDiagnostic';
import MyPathway from './pages/MyPathway';
import ModulesLibrary from './pages/ModulesLibrary';
import ModulePlayer from './pages/ModulePlayer';
import ToolsHub from './pages/ToolsHub';
import Journal from './pages/Journal';
import __Layout from './Layout.jsx';


export const PAGES = {
    "Landing": Landing,
    "OurWhy": OurWhy,
    "ALIVEMethod": ALIVEMethod,
    "Experts": Experts,
    "Apply": Apply,
    "Contact": Contact,
    "Dashboard": Dashboard,
    "OnboardingDiagnostic": OnboardingDiagnostic,
    "MyPathway": MyPathway,
    "ModulesLibrary": ModulesLibrary,
    "ModulePlayer": ModulePlayer,
    "ToolsHub": ToolsHub,
    "Journal": Journal,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};