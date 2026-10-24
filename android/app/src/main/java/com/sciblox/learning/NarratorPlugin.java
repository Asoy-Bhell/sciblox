package com.sciblox.learning;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.os.Bundle;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@CapacitorPlugin(name="Narrator")
public class NarratorPlugin extends Plugin {
    private TextToSpeech engine;
    private volatile boolean ready=false;
    @Override public void load(){
        engine=new TextToSpeech(getContext(),status->{
            ready=status==TextToSpeech.SUCCESS;
            if(ready&&engine!=null)engine.setOnUtteranceProgressListener(new UtteranceProgressListener(){
                @Override public void onStart(String id){}
                @Override public void onDone(String id){finished(id);}
                @Override public void onError(String id){finished(id);}
            });
        });
    }
    private void finished(String id){JSObject event=new JSObject();event.put("id",id);notifyListeners("finished",event);}
    @PluginMethod public void speak(PluginCall call){
        if(!ready||engine==null){call.resolve(new JSObject().put("spoken",false));return;}
        String text=call.getString("text","");
        if(text.isEmpty()){call.resolve(new JSObject().put("spoken",false));return;}
        boolean tagalog="tl".equals(call.getString("language","en"));
        Set<Voice> voices=engine.getVoices();Voice selected=null;
        if(voices!=null)for(Voice voice:voices){if(!voice.isNetworkConnectionRequired()&&(tagalog?(voice.getLocale().getLanguage().equals("tl")||voice.getLocale().getLanguage().equals("fil")):voice.getLocale().getLanguage().equals(Locale.ENGLISH.getLanguage()))&&(selected==null||femaleScore(voice)>femaleScore(selected)))selected=voice;}
        if(selected==null){call.resolve(new JSObject().put("spoken",false));return;}
        engine.setVoice(selected);engine.setSpeechRate(.94f);engine.setPitch(1.04f);
        int status=engine.speak(text,TextToSpeech.QUEUE_FLUSH,new Bundle(),UUID.randomUUID().toString());
        call.resolve(new JSObject().put("spoken",status==TextToSpeech.SUCCESS).put("voiceName",selected.getName()).put("recordedVoice",false));
    }
    private int femaleScore(Voice voice){String name=voice.getName().toLowerCase(Locale.ROOT);return name.matches(".*(female|woman|zira|samantha|susan|hazel|jenny).*")?1:0;}
    @PluginMethod public void stop(PluginCall call){if(engine!=null)engine.stop();call.resolve();}
    @Override protected void handleOnDestroy(){if(engine!=null){engine.stop();engine.shutdown();}ready=false;}
}
