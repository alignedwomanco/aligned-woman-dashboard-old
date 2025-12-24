import ALIVEMethod from './pages/ALIVEMethod';
import AdminSettings from './pages/AdminSettings';
import Apply from './pages/Apply';
import Blueprint from './pages/Blueprint';
import CheckIn from './pages/CheckIn';
import Contact from './pages/Contact';
import Dashboard from './pages/Dashboard';
import Experts from './pages/Experts';
import Journal from './pages/Journal';
import Landing from './pages/Landing';
import ModuleFrameworkBuilder from './pages/ModuleFrameworkBuilder';
import ModulePlayer from './pages/ModulePlayer';
import ModulesLibrary from './pages/ModulesLibrary';
import MyMetrics from './pages/MyMetrics';
import MyPathway from './pages/MyPathway';
import OnboardingForm from './pages/OnboardingForm';
import OurWhy from './pages/OurWhy';
import Progress from './pages/Progress';
import Settings from './pages/Settings';
import ToolsHub from './pages/ToolsHub';
import DailyCheckIn from './pages/DailyCheckIn';
import __Layout from './Layout.jsx';


export const PAGES = {
    "ALIVEMethod": ALIVEMethod,
    "AdminSettings": AdminSettings,
    "Apply": Apply,
    "Blueprint": Blueprint,
    "CheckIn": CheckIn,
    "Contact": Contact,
    "Dashboard": Dashboard,
    "Experts": Experts,
    "Journal": Journal,
    "Landing": Landing,
    "ModuleFrameworkBuilder": ModuleFrameworkBuilder,
    "ModulePlayer": ModulePlayer,
    "ModulesLibrary": ModulesLibrary,
    "MyMetrics": MyMetrics,
    "MyPathway": MyPathway,
    "OnboardingForm": OnboardingForm,
    "OurWhy": OurWhy,
    "Progress": Progress,
    "Settings": Settings,
    "ToolsHub": ToolsHub,
    "DailyCheckIn": DailyCheckIn,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};