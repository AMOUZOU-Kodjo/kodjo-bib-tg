import LegalPage, { LegalSection } from "../components/layout/LegalPage";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function MentionsLegales() {
  const { contactEmail, siteName } = useSiteSettings();
  return (
    <LegalPage title="Mentions légales">
      <LegalSection title="Éditeur du site">
        <p>
          <strong>{siteName}</strong> est une plateforme collaborative et gratuite de partage de documents,
          éditée à but non lucratif. Le responsable de la publication est l'équipe {siteName}.
        </p>
        <p>
          Contact : {contactEmail ? (
            <a href={`mailto:${contactEmail}`} className="text-teal-700 hover:underline">{contactEmail}</a>
          ) : (
            "via le formulaire de contact"
          )}
        </p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Le site est hébergé par <strong>Cloudflare, Inc.</strong> (Cloudflare Pages), 101 Townsend Street,
          San Francisco, CA 94107, États-Unis. L'API est hébergée par <strong>Render Services, Inc.</strong>,
          525 Brannan Street, Suite 300, San Francisco, CA 94107, États-Unis.
        </p>
        <p>
          Les données sont stockées par <strong>Neon, Inc.</strong> (base de données PostgreSQL),
          <strong> Cloudinary Ltd.</strong> (fichiers déposés) et <strong>Sendinblue SAS</strong> (Brevo),
          106 boulevard Haussmann, 75008 Paris, France (envoi des e-mails).
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Les documents déposés restent la propriété de leurs auteurs, qui accordent à la plateforme
          une licence non exclusive d'hébergement et d'affichage public. L'interface, le code source
          et les éléments graphiques du site sont protégés par le droit de la propriété intellectuelle.
        </p>
        <p>
          Toute reproduction ou réutilisation non autorisée d'un document est interdite. Pour signaler
          un contenu portant atteinte à vos droits,{" "}
          {contactEmail ? (
            <>écrivez à <a href={`mailto:${contactEmail}`} className="text-teal-700 hover:underline">{contactEmail}</a>.</>
          ) : (
            "utilisez le formulaire de contact."
          )}
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>
          La plateforme met à disposition un service de partage de documents sans garantie de contenu.
          Chaque utilisateur demeure responsable des documents qu'il publie et de l'usage qu'il en fait.
          L'éditeur ne saurait être tenu responsable des dommages indirects liés à l'utilisation du site.
        </p>
        <p>
          Les liens externes présents sur le site ne sauraient engager la responsabilité de l'éditeur
          quant à leur contenu.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Le site est soumis au droit français, notamment à la loi n° 2004-575 du 21 juin 2004 pour la
          confiance dans l'économie numérique (LCEN). Tout litige relève des juridictions françaises compétentes.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
