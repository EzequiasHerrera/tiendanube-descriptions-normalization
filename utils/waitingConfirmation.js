const waitingConfirmation = () => {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("🛑 Presioná Enter para continuar con la subida...\n", () => {
            rl.close();
            resolve();
        });
    });
};

export default waitingConfirmation;