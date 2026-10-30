import LegalPage, { LegalSection } from "../components/layout/LegalPage";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function CGU() {
  const { contactEmail, creditsParUpload, siteName } = useSiteSettings();
  return (
    <LegalPage title="Conditions générales d'utilisation">
      <LegalSection title="Objet">
        <p>
          Les présentes conditions générales d'utilisation (CGU) encadrent l'accès et l'utilisation de
          la plateforme {siteName}, service gratuit de dépôt, de consultation et de partage de documents.
          En créant un compte, vous acceptez sans réserve les présentes CGU.
        </p>
      </LegalSection>

      <LegalSection title="Accès au service">
        <p>
          La consultation du catalogue et des pages de documents est ouverte à tous. Le dépôt,
          le téléchargement, les likes, les commentaires et le contact d'un auteur nécessitent
          un compte dont l'adresse e-mail a été vérifiée.
        </p>
        <p>
          Le service est fourni « en l'état », sans garantie de disponibilité continue. Des interruptions
          pour maintenance peuvent survenir.
        </p>
      </LegalSection>

      <LegalSection title="Compte utilisateur">
        <ul className="list-disc pl-5 space-y-1">
          <li>Vous vous engagez à fournir des informations exactes et à les tenir à jour.</li>
          <li>Vos identifiants sont personnels : vous êtes responsable de leur confidentialité.</li>
          <li>Un seul compte par personne est autorisé. Les comptes frauduleux peuvent être suspendus.</li>
          <li>Vous pouvez supprimer votre compte à tout moment depuis votre profil ou en nous écrivant.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Règles de dépôt">
        <p>En déposant un document, vous certifiez :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>disposer des droits nécessaires pour le partager publiquement ;</li>
          <li>que le document ne contient aucun contenu illicite, haineux, diffamatoire, violent ou pornographique ;</li>
          <li>qu'il ne porte pas atteinte à la vie privée, au secret professionnel ou aux droits de tiers ;</li>
          <li>qu'il ne contient pas de logiciel malveillant.</li>
        </ul>
        <p>
          Les formats et tailles acceptés sont indiqués sur la page de dépôt. La modération peut
          refuser ou retirer tout contenu non conforme, sans préavis.
        </p>
      </LegalSection>

      <LegalSection title="Crédits et téléchargements">
        <p>
          Chaque document déposé et accepté rapporte{" "}
          <strong>{creditsParUpload} crédit{creditsParUpload > 1 ? "s" : ""}</strong>. Un téléchargement
          coûte <strong>1 crédit</strong>, sauf pour vos propres documents et pour un document déjà
          téléchargé. Les crédits sont attribués à titre personnel, n'ont aucune valeur monétaire
          et ne sont ni échangeables ni transférables.
        </p>
        <p>
          Toute tentative de contournement du système de crédits (comptes multiples, fichiers vides,
          contenus dupliqués) peut entraîner la suspension du compte.
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle et licence">
        <p>
          Vous conservez la propriété intellectuelle de vos documents. En les publiant, vous accordez
          à {siteName} une licence mondiale, non exclusive et gratuite pour héberger, afficher et
          distribuer ces documents aux utilisateurs de la plateforme, pour la durée de leur publication.
        </p>
        <p>
          Cette licence prend fin lors de la suppression du document, sans remettre en cause les
          téléchargements déjà effectués par des tiers.
        </p>
      </LegalSection>

      <LegalSection title="Modération et signalement">
        <p>
          L'équipe peut examiner, masquer ou supprimer tout document ou message signalé comme
          non conforme. Pour signaler un contenu,{" "}
          {contactEmail ? (
            <>écrivez à <a href={`mailto:${contactEmail}`} className="text-teal-700 hover:underline">{contactEmail}</a>{" "}</>
          ) : (
            "utilisez le formulaire de contact "
          )}
          en précisant le lien concerné et le motif.
        </p>
      </LegalSection>

      <LegalSection title="Responsabilité">
        <p>
          Les documents sont publiés sous la responsabilité de leurs auteurs. {siteName} ne garantit
          ni leur exactitude, ni leur qualité, ni leur conformité à un usage particulier. L'utilisateur
          utilise les documents téléchargés sous sa propre responsabilité.
        </p>
        <p>
          L'éditeur ne pourra être tenu responsable des dommages indirects, pertes de données ou
          préjudices résultant de l'utilisation ou de l'indisponibilité du service.
        </p>
      </LegalSection>

      <LegalSection title="Suspension et résiliation">
        <p>
          En cas de manquement aux présentes CGU, le compte peut être suspendu ou supprimé.
          Vous pouvez résilier votre compte à tout moment ; les documents publiés seront supprimés
          avec lui, sous réserve des obligations légales de conservation.
        </p>
      </LegalSection>

      <LegalSection title="Modification des CGU">
        <p>
          Les CGU peuvent être modifiées pour s'adapter à l'évolution du service ou de la réglementation.
          La date de mise à jour figure en haut de cette page. L'utilisation du service après une
          modification vaut acceptation des nouvelles conditions.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable et litiges">
        <p>
          Les présentes CGU sont soumises au droit français. En cas de litige, une solution amiable
          sera recherchée en priorité{" "}
          {contactEmail ? (
            <>via <a href={`mailto:${contactEmail}`} className="text-teal-700 hover:underline">{contactEmail}</a>{" "}</>
          ) : (
            "via le formulaire de contact "
          )}
          avant toute action judiciaire devant les juridictions compétentes.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
