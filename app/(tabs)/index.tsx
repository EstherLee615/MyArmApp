import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

export default function Page() {
  const htmlPage = require('../../assets/web_content/index.html');

  if (Platform.OS === 'web') {
    return (
      <iframe
        title="智慧頌缽療癒機器人"
        src="/myarmapp/index.html"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          border: 0,
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <WebView 
        // 從 app/(tabs)/ 回到專案根目錄，再載入實際的網頁檔案
        //source={require('../../assets/web_content/index.html')} 
        source={htmlPage} 
        style={{ flex: 1 }}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        originWhitelist={['*']}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
