import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { useI18n } from '../i18n';

export default function NotFound() {
  const { t } = useI18n();
  return (
    <div>
      <section className="page-hero">
        <div className="orb orb-1 -top-20 left-1/3 opacity-30" />
        <div className="orb orb-2 top-10 right-[-50px] opacity-20" />
        <div className="relative z-10">
          <Reveal>
            <div className="font-display text-7xl font-extrabold text-gold-gradient">404</div>
          </Reveal>
          <Reveal variant="up" delay={150}>
            <h1 className="mt-3 font-display text-4xl font-extrabold text-white md:text-5xl">{t('notfound.title')}</h1>
          </Reveal>
          <Reveal variant="up" delay={250}>
            <p className="mt-3 text-white/50 max-w-lg mx-auto">
              {t('notfound.desc')}
            </p>
          </Reveal>
          <Reveal variant="up" delay={350}>
            <div className="mt-6 flex flex-wrap justify-center gap-4">
              <Link to="/" className="btn-lux rounded-full px-7 py-3 text-sm font-bold">{t('notfound.back_home')}</Link>
              <Link to="/trucks" className="btn-ghost-lux rounded-full px-7 py-3 text-sm font-bold text-white">{t('notfound.view_catalog')}</Link>
            </div>
          </Reveal>
        </div>
      </section>
    </div>
  );
}
