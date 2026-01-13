import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

const NotFound = () => {
    const { t } = useLanguage();
    return (
        <div className="text-center py-20">
            <h1 className="text-6xl font-bold mb-4">{t('not_found.title')}</h1>
            <p className="text-xl mb-8">{t('not_found.desc')}</p>
            <Link to="/" className="text-blue-500 hover:underline">
                {t('not_found.back')}
            </Link>
        </div>
    );
};

export default NotFound;
