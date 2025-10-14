import puppeteer from 'puppeteer';

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    // 🔐 Ir al login
    await page.goto('https://www.tiendanube.com/login');
    console.log('🛑 Iniciá sesión manualmente y presioná Enter en la terminal cuando estés dentro del panel...');
    await new Promise(resolve => process.stdin.once('data', resolve));

    // 📍 Ir a la sección de organización de productos
    await page.goto('https://kitchentools.mitiendanube.com/admin/v2/products/organize', {
        waitUntil: 'networkidle2'
    });

    // 🧭 Activar pestaña "Ordenar"
    await page.waitForSelector('.nimbus--tabs');
    await page.evaluate(() => {
        const tabs = Array.from(document.querySelectorAll('.nimbus--tab'));
        const ordenarTab = tabs.find(tab => tab.textContent.trim() === 'Ordenar');
        if (ordenarTab) ordenarTab.click();
    });
    await sleep(1000);
    console.log('🧭 Pestaña "Ordenar" activada');

    // 🕵️ Obtener todas las categorías del select
    await page.waitForSelector('#select_categoryId', { visible: true });
    const categories = await page.$$eval('#select_categoryId option', options =>
        options
            .map(opt => ({ id: opt.value, name: opt.textContent.trim() }))
            .filter(opt => opt.id !== '0' && opt.value !== '')
    );

    console.log(`🔍 Se encontraron ${categories.length} categorías.`);

    const newCategories = ["", "", "", "", "", "", "", "", "", "", "", ""];


    for (const category of categories) {
        console.log(`➡️ Procesando: ${category.name}`);
        // if (newCategories.some((newCat) => newCat === category.name)) { //SE USA CUANDO TENGA CATEGORIAS NUEVAS

        // Seleccionar la categoría
        await page.select('#select_categoryId', category.id);
        await sleep(1500); // esperar que cargue productos

        // Seleccionar orden A-Z
        await page.select('#select_sortBy', 'alpha-ascending');
        await sleep(500);

        // Hacer clic en "Guardar"
        const saveButton = await page.$('button.nimbus--button--primary');
        if (saveButton) {
            await saveButton.click();
            console.log(`✅ Guardado: ${category.name}`);
            await sleep(1000);
        } else {
            console.warn(`⚠️ No se encontró botón de guardar para: ${category.name}`);
        }
        // }
    }

    console.log('🎉 Todas las categorías fueron ordenadas alfabéticamente.');
    await browser.close();
})();