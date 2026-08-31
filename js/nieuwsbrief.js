const nieuwsbriefForm = document.getElementById('nieuwsbriefForm');
const nbSubmitBtn = nieuwsbriefForm?.querySelector('.nieuwsbrief-form__submit');

function genereerWachtwoord() {
  return Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);
}

async function schrijfInVoorNieuwsbrief(email) {
  const mutation = `
    mutation customerCreate($input: CustomerCreateInput!) {
      customerCreate(input: $input) {
        customer { id email }
        customerUserErrors { field message code }
      }
    }
  `;

  const res = await fetch(`https://${SHOPIFY_DOMEIN}/api/${API_VERSIE}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({
      query: mutation,
      variables: {
        input: {
          email,
          password: genereerWachtwoord(),
          acceptsMarketing: true,
        },
      },
    }),
  });

  const json = await res.json();
  return json.data.customerCreate;
}

if (nieuwsbriefForm) {
  nieuwsbriefForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('nieuwsbriefEmail').value;

    nbSubmitBtn.textContent = 'BEZIG...';
    nbSubmitBtn.disabled = true;

    try {
      const result = await schrijfInVoorNieuwsbrief(email);

      const alBestaandeEmailFout = result.customerUserErrors.find(
        err => err.code === 'TAKEN' || err.message.toLowerCase().includes('taken')
      );

      if (alBestaandeEmailFout) {
        nbSubmitBtn.textContent = '✓ AL AANGEMELD';
      } else if (result.customerUserErrors.length > 0) {
        console.error('Nieuwsbrief fout:', result.customerUserErrors);
        nbSubmitBtn.textContent = 'PROBEER OPNIEUW';
        nbSubmitBtn.disabled = false;
        return;
      } else {
        nbSubmitBtn.textContent = '✓ AANGEMELD';
        nieuwsbriefForm.reset();
      }

      setTimeout(() => {
        nbSubmitBtn.textContent = 'AANMELDEN';
        nbSubmitBtn.disabled = false;
      }, 4000);

    } catch (err) {
      console.error('Nieuwsbrief fout:', err);
      nbSubmitBtn.textContent = 'PROBEER OPNIEUW';
      nbSubmitBtn.disabled = false;
    }
  });
}