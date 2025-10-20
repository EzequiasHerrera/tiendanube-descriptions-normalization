import readline from "readline";

const waitingConfirmation = (show = null) => {
    return new Promise((resolve, reject) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });

        if(show == null){
            rl.question("🛑 Presioná Enter para continuar o escribí 's' para saltear este producto...\n", (input) => {
                rl.close();
                if (input.trim().toLowerCase() === 's') {
                    reject(new Error("Producto salteado manualmente"));
                } else {
                    resolve();
                }
            });
        }else{
            console.log(show);
            rl.question("🛑 Presioná Enter para continuar o escribí 's' para saltear este producto...\n", (input) => {
                rl.close();
                if (input.trim().toLowerCase() === 's') {
                    reject(new Error("Producto salteado manualmente"));
                } else {
                    resolve();
                }
            });
        }
    });
};

export default waitingConfirmation;