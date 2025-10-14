(async () => {
    const url = 'https://www.tiendanube.com/apps/authorize/token';

    const params = new URLSearchParams();
    params.append('client_id', '21602');
    params.append('client_secret', '131fd3948b3daf0b4a468a40946c82003d8f5be4ad48fca1');
    params.append('grant_type', 'authorization_code');
    params.append('code', "5e285836a36ddcbb577c2b86ea1a7e97172d1f15");

    try {
        fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params
        }).then(res => res.json()).then(data => console.log(data));

    } catch (error) {
        console.error('Error al canjear el código:', error);
    }
})()