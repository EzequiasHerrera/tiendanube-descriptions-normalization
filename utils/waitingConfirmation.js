import readline from "readline";

const waitingConfirmation = () => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        rl.question("🛑 Presioná Enter para continuar o escribí 's' para saltear este producto...\n", (input) => {
            rl.close();
            if (input.trim().toLowerCase() === 's') {
                reject(new Error("Producto salteado manualmente"));
            } else {
                resolve();
            }
        });
    });
};

export default waitingConfirmation;