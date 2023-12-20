define([], () => {
    return {
        LoadingContainer: {
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
        },
        Loading: {
            flex: '0 0 auto',
            border: '1px solid rgba(200, 200, 200, 0.4)',
            borderRadius: '4px',
            backgroundColor: 'rgba(200, 200, 200, 0.2)',
            padding: '10px',
            margin: '10px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
        },
        LoadingInline: {
            flex: '0 0 auto',
            padding: '4px',
            margin: '4px',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'center',
            alignItems: 'center'
        },
        LoadingMessage: {
            marginLeft: '1em'
        }
    };
});