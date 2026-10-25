// localized-ui
import {t} from './i18n';
import React from 'react';
import {createRoot} from 'react-dom/client';
import {readProgress} from './mobile';
import JourneyApp from './JourneyApp';
import './style.css';
import './mobile.css';
import './journey.css';
import './animation.css';
import './game3d.css';
import './mobile-upgrade.css';
readProgress().catch(()=>({})).then(initialProgress=>createRoot(document.getElementById('root')).render(<JourneyApp initialProgress={initialProgress}/>));

import './concept-ui.css';

import './reference-ui.css';
import './upgrade-ui.css';

import './compact-guide-ui.css';
