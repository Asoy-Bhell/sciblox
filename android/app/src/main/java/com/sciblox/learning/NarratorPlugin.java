package com.sciblox.learning;

import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;
import android.speech.tts.Voice;
import android.os.Bundle;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.ArrayList;
import java.util.Comparator;

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
        String requested=call.getString("voiceName","");
        if(voices!=null)for(Voice voice:voices){if(matches(voice,tagalog)&&(selected==null||voice.getName().equals(requested)||!selected.getName().equals(requested)&&(femaleScore(voice)>femaleScore(selected)||femaleScore(voice)==femaleScore(selected)&&voice.getName().compareTo(selected.getName())<0)))selected=voice;}
        if(selected==null){call.resolve(new JSObject().put("spoken",false));return;}
        engine.setVoice(selected);engine.setSpeechRate(.9f);engine.setPitch(1f);
        int status=engine.speak(text,TextToSpeech.QUEUE_FLUSH,new Bundle(),UUID.randomUUID().toString());
        call.resolve(new JSObject().put("spoken",status==TextToSpeech.SUCCESS).put("voiceName",selected.getName()).put("recordedVoice",false));
    }
    private int femaleScore(Voice voice){String name=voice.getName().toLowerCase(Locale.ROOT);return name.matches(".*(female|woman|zira|samantha|susan|hazel|jenny).*")?1:0;}
    private boolean matches(Voice voice,boolean tagalog){String lang=voice.getLocale().getLanguage();return !voice.isNetworkConnectionRequired()&&(voice.getFeatures()==null||!voice.getFeatures().contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED))&&(tagalog?lang.equals("tl")||lang.equals("fil"):lang.equals("en"));}
    @PluginMethod public void voices(PluginCall call){
        JSArray result=new JSArray();boolean tagalog="tl".equals(call.getString("language","en"));
        if(ready&&engine!=null&&engine.getVoices()!=null){ArrayList<Voice> sorted=new ArrayList<>(engine.getVoices());sorted.sort(Comparator.comparing(Voice::getName));for(Voice voice:sorted)if(matches(voice,tagalog))result.put(new JSObject().put("id",voice.getName()).put("name",voice.getName()).put("language",voice.getLocale().toLanguageTag()));}
        call.resolve(new JSObject().put("voices",result));
    }
    @PluginMethod public void stop(PluginCall call){if(engine!=null)engine.stop();call.resolve();}
    @Override protected void handleOnDestroy(){if(engine!=null){engine.stop();engine.shutdown();}ready=false;}
}
