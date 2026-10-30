import LegalPage, { LegalSection } from "../components/layout/LegalPage";
import { useSiteSettings } from "../context/SiteSettingsContext";

export default function Confidentialite() {
  const { contactEmail, siteName } = useSiteSettings();
  return (
    <LegalPage title="Politique de confidentialité">
      <LegalSection title="Responsable du traitement">
        <p>
          Les données personnelles collectées sur {siteName} sont traitées par l'équipe éditoriale de
          la plateforme, responsable du traitement. Pour toute question :{" "}
          {contactEmail ? (
            <a href={`mailto:${contactEmail}`} className="text-teal-700 hover:underline">{contactEmail}</a>
          ) : (
            "utilisez le formulaire de contact"
          )}.
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <ul className="list-disc pl-5 space-y-1">
          <li><strong>Compte :</strong> nom affiché, adresse e-mail, mot de passe (stocké sous forme de hachage), solde de crédits.</li>
          <li><strong>Documents :</strong> fichiers déposés, titre, description, catégorie et métadonnées techniques.</li>
          <li><strong>Interactions :</strong> likes, vues, téléchargements et commentaires.</li>
          <li><strong> Messages de contact :</strong> objet, contenu et date d'envoi à l'auteur d'un document.</li>
          <li><strong>Données techniques :</strong> adresse IP et journaux de connexion, pour la sécurité et la prévention des abus.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Finalités et bases légales">
        <ul className="list-disc pl-5 space-y-1">
          <li>Création et gestion du compte : exécution du contrat d'utilisation.</li>
          <li>Hébergement, affichage et téléchargement des documents : exécution du service.</li>
          <li>Sécurité, lutte contre la fraude et modération : intérêt légitime.</li>
          <li>Envoi d'e-mails transactionnels (vérification, réinitialisation) : exécution du contrat.</li>
          <li>Mesure d'audience et cookies non essentiels : consentement, révocable à tout moment.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Cookies et stockage local">
        <p>
          La plateforme utilise un cookie d'authentification strictement nécessaire (httpOnly, sécurisé)
          pour maintenir votre session. Votre choix concernant les cookies est enregistré dans le stockage
          local de votre navigateur. Aucun cookie publicitaire ni traceur tiers n'est utilisé.
        </p>
        <p>
          Vous pouvez modifier votre choix à tout moment via le lien « Gérer les cookies » présent dans
          le pied de page.
        </p>
      </LegalSection>

      <LegalSection title="Destinataires et sous-traitants">
        <p>
          Les données sont accessibles aux seuls membres habilités de l'équipe et aux prestataires
          techniques suivants : Neon (base de données), Cloudinary (stockage des fichiers),
          Brevo (envoi d'e-mails), Cloudflare et Render (hébergement). Ces prestataires agissent
          sur nos instructions et selon des garanties contractuelles appropriées.
        </p>
        <p>
          Certains prestataires étant établis hors de l'Union européenne, les transferts sont encadrés
          par les clauses contractuelles types de la Commission européenne.
        </p>
      </LegalSection>

      <LegalSection title="Durées de conservation">
        <ul className="list-disc pl-5 space-y-1">
          <li>Compte : jusqu'à sa suppression, puis suppression des données associées.</li>
          <li>Documents : jusqu'à leur suppression par leur auteur ou par la modération.</li>
          <li>Journaux techniques : 12 mois maximum.</li>
          <li>Messages de contact : 12 mois après leur envoi.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Vos droits">
        <p>
          Conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement,
          de limitation, d'opposition et de portabilité de vos données. Vous pouvez exercer ces droits
          {contactEmail ? (
            <>en écrivant à <a href={`mailto:${contactEmail}`} className="text-teal-700 hover:underline">{contactEmail}</a>.</>
          ) : (
            "via le formulaire de contact."
          )}
          Une réponse vous sera apportée dans un délai d'un mois.
        </p>
        <p>
          En cas de désaccord, vous pouvez introduire une réclamation auprès de la CNIL
          (3 place de Fontenoy, TSA 80715, 75334 Paris Cedex 07) ou sur cnil.fr.
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les mots de passe sont hachés, les échanges chiffrés (HTTPS) et l'accès aux données restreint.
          Malgré ces mesures, aucun système n'est infaillible : en cas d'incident, les utilisateurs
          concernés seront informés dans les meilleurs délais.
        </p>
      </LegalSection>

      <LegalSection title="Mineurs">
        <p>
          La plateforme est accessible aux personnes âgées de 15 ans et plus. En dessous de cet âge,
          le consentement d'un titulaire de l'autorité parentale est requis pour la collecte des données.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
