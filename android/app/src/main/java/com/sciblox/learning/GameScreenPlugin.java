package com.sciblox.learning;

import android.content.pm.ActivityInfo;
import android.content.res.Configuration;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name="GameScreen")
public class GameScreenPlugin extends Plugin {
    @PluginMethod public void orient(PluginCall call) {
        boolean landscape="landscape".equals(call.getString("mode","portrait"));
        getActivity().runOnUiThread(()->{
            getActivity().setRequestedOrientation(landscape?ActivityInfo.SCREEN_ORIENTATION_SENSOR_LANDSCAPE:ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
            call.resolve(new JSObject().put("requested",landscape?"landscape":"portrait"));
        });
    }
    @PluginMethod public void status(PluginCall call) {
        call.resolve(new JSObject().put("requested",getActivity().getRequestedOrientation()).put("landscape",getContext().getResources().getConfiguration().orientation==Configuration.ORIENTATION_LANDSCAPE));
    }
}
