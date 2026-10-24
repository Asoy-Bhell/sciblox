import {spawnSync} from 'node:child_process';
import {existsSync,readdirSync} from 'node:fs';
import path from 'node:path';
const bundle=process.argv[2]==='bundle';
const env={...process.env};
const studioJava='C:/Program Files/Android/Android Studio/jbr';
const portableBase=path.resolve('.tools/java21');
if(!env.JAVA_HOME&&existsSync(portableBase)){
 const portable=readdirSync(portableBase).map(name=>path.join(portableBase,name)).find(dir=>existsSync(path.join(dir,'bin/java.exe')));
 if(portable)env.JAVA_HOME=portable;
}
if(!env.JAVA_HOME&&existsSync(studioJava))env.JAVA_HOME=studioJava;
if(!env.ANDROID_HOME&&env.LOCALAPPDATA&&existsSync(env.LOCALAPPDATA+'/Android/Sdk'))env.ANDROID_HOME=env.LOCALAPPDATA+'/Android/Sdk';
const java=spawnSync(env.JAVA_HOME?env.JAVA_HOME+'/bin/java':'java',['-version'],{env,encoding:'utf8'});
if(java.error||java.status!==0){console.error('Android build needs Java 21+ and the Android SDK. Install Android Studio, then set JAVA_HOME to its jbr folder. See ANDROID.md.');process.exit(1)}
const major=Number((java.stderr+java.stdout).match(/version "(\d+)/)?.[1]);
if(!major||major<21||major>24){console.error('This Android project requires Java 21–24. Set JAVA_HOME to Java 21; the newest Android Studio may bundle an incompatible Java 25. See ANDROID.md.');process.exit(1)}
if(!env.ANDROID_HOME&&!env.ANDROID_SDK_ROOT&&!existsSync('android/local.properties')){console.error('Android SDK not found. Install API 36 in Android Studio and set ANDROID_HOME. See ANDROID.md.');process.exit(1)}
if(bundle&&!existsSync('android/keystore.properties')){console.error('Release signing is not configured. Create android/keystore.properties using the example, or generate a signed AAB in Android Studio. See ANDROID.md.');process.exit(1)}
const windows=process.platform==='win32';
const command=windows?'cmd.exe':'./gradlew';
const args=windows?['/d','/c','gradlew.bat',bundle?'bundleRelease':'assembleDebug']: [bundle?'bundleRelease':'assembleDebug'];
const result=spawnSync(command,args,{cwd:'android',env,stdio:'inherit'});process.exit(result.status??1);
