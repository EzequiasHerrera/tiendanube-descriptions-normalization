const getTokenAndStore = (storeName) => {
    let token, store;
    if (storeName === "KTGASTRO") {
        token = process.env.TOKEN_KT_GASTRO;
        store = process.env.STORE_ID_KTGASTRO;
    } else {
        token = process.env.TOKEN_KT_HOGAR;
        store = process.env.STORE_ID_KTHOGAR;
    }
    return { token, store };
}

export default getTokenAndStore;