<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
define('MAX_FILE_SIZE', 120000000);
error_reporting(E_ALL);
require 'vendor/autoload.php';
require_once('config.php');
require_once('sd.php');

$debug = false;
if(isset($_GET['debug'])){
	$debug = true;
}
if($debug){
	echo 'Debug<br/>';
}

function rdie($a){
	echo json_encode($a);die();
}
function pre($a){
	echo '<pre>'.json_encode($a,JSON_PRETTY_PRINT).'</pre>';
}

$mf = dirname(__FILE__).'/matches_opendota';
$checked_f = dirname(__FILE__).'/checked';
if (!file_exists($mf)) {
    mkdir($mf, 0777, true);
}
if (!file_exists($checked_f)) {
    mkdir($checked_f, 0777, true);
}
if(!file_exists(dirname(__FILE__).'/cs.json')){
    die('echo cs.json not found');
}
$csjson = file_get_contents(dirname(__FILE__).'/cs.json');
$f1 = explode(', heroes_bg = ',$csjson);
$f2 = explode('var heroes = ',$f1[0]);
if(!isset($f2[1])){
    die('cs.json heroes problem');
}
$h = json_decode($f2[1],true);
if(!is_array($h)){
    die('cs.json heroes problem');
}
$f3 = explode(', win_rates =',$csjson);
$f4 = explode(', heroes_wr = ',$f3[0]);
if(!isset($f4[1])){
    die('cs.json heroes_wr problem');
}
$h_wr = json_decode($f4[1],true);
if(!is_array($h_wr)){
    die('cs.json heroes_wr problem');
}
$f5 = explode('win_rates = ',$csjson);
if(!isset($f5[1])){
    die('cs.json win_rates problem');
}
$f6 = explode(', update_time',$f5[1]);
$h_wrs = json_decode($f6[0],true);
if(!is_array($h_wrs)){
    die('cs.json win_rates problem');
}
$hero = [];
function cn($s){
	$a = strtolower($s);
	if($a == 'outworld devourer'){
		$s = 'outworld destroyer';
	}
	return preg_replace('/[0-9]+/', '', strtolower(preg_replace("/[^A-Za-z0-9 ]/", '', $s)));
}
foreach($h as $hh){
	$hero[] = cn($hh);
}

// Fetch OpenDota heroes to map hero_id -> localized_name and image
$od_heroes_gc = get_html('https://api.opendota.com/api/heroes');
$od_heroes = json_decode($od_heroes_gc,true);
$od_id_to_name = [];
$od_id_to_short = [];
if(is_array($od_heroes)){
	foreach($od_heroes as $oh){
		if(isset($oh['id'])){
			$od_id_to_name[$oh['id']] = isset($oh['localized_name']) ? $oh['localized_name'] : '';
			if(isset($oh['name'])){
				$od_id_to_short[$oh['id']] = str_replace('npc_dota_hero_','',$oh['name']);
			}
		}
	}
}

// Fetch live matches
$u = 'https://api.opendota.com/api/live';
$gc = get_html($u);
if(!$gc){
    rdie(['error'=>'No GC']);
}
$live = json_decode($gc,true);
if(!is_array($live)){
    rdie(['error'=>'Bad live format']);
}

$res_matches = [];
foreach($live as $mobj){
	if(!isset($mobj['match_id'])){ continue; }
	$match_id = $mobj['match_id'];
	$scoreboard = isset($mobj['scoreboard']) ? $mobj['scoreboard'] : [];
	if(!isset($scoreboard['radiant']) || !isset($scoreboard['dire'])){ continue; }
	$rad = $scoreboard['radiant'];
	$dire = $scoreboard['dire'];
	if(!isset($rad['picks']) || !isset($dire['picks'])){ continue; }
	if(!is_array($rad['picks']) || !is_array($dire['picks'])){ continue; }
	if(sizeof($rad['picks']) != 5 || sizeof($dire['picks']) != 5){ continue; }

	$nm = [];
	$nm['name'] = 'OpenDota Live';
	$nm['match_id'] = (string)$match_id;
	$nm['mid'] = (string)$match_id; // single identifier for this source

	$team1 = [];
	$team2 = [];
	$team1['name'] = isset($mobj['radiant_team']['team_name']) && $mobj['radiant_team']['team_name'] ? $mobj['radiant_team']['team_name'] : 'Radiant';
	$team2['name'] = isset($mobj['dire_team']['team_name']) && $mobj['dire_team']['team_name'] ? $mobj['dire_team']['team_name'] : 'Dire';
	$team1['ss'] = 'Radiant';
	$team2['ss'] = 'Dire';
	$team1['heroes'] = [];
	$team2['heroes'] = [];

	$build_pick = function($pick) use ($hero,$od_id_to_name,$od_id_to_short){
		$hh = [];
		if(!isset($pick['hero_id'])){ return false; }
		$hid = $pick['hero_id'];
		$hname = isset($od_id_to_name[$hid]) ? $od_id_to_name[$hid] : '';
		$short = isset($od_id_to_short[$hid]) ? $od_id_to_short[$hid] : '';
		if(!$hname){ return false; }
		$hh['id'] = array_search(cn($hname),$hero);
		if($hh['id'] === false){ return false; }
		$hh['hname'] = $hname;
		if($short){
			$hh['image'] = 'https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/'.$short.'.png';
		}
		return $hh;
	};

	$ok = true;
	foreach($rad['picks'] as $p){
		$pp = $build_pick($p);
		if($pp===false){ $ok=false; break; }
		$team1['heroes'][] = $pp;
	}
	if(!$ok){ continue; }
	foreach($dire['picks'] as $p){
		$pp = $build_pick($p);
		if($pp===false){ $ok=false; break; }
		$team2['heroes'][] = $pp;
	}
	if(!$ok){ continue; }

	$nm['team1'] = $team1;
	$nm['team2'] = $team2;
	$res_matches[] = $nm;
}

if($debug){
    echo 'DEBUG MODE<br/>';
}
echo 'Games : '.sizeof($res_matches).'<br/>';
foreach($res_matches as $m){
	echo $m['mid'].'<br/>';
	$file = $mf.'/cyber.'.$m['mid'].'.json';
	if($debug||!file_exists($file)){
		$cond_one = false;
		$cond_2 = false;
		$cond_3 = false;
		$cond_4 = false;
		$cond_5 = false;

		$hero_have_hh = false;
		$hero_have_anh = false;
		$nb1 = 0;
		$nb2 = 0;
		$m['team1']['cc_neg'] = 0;
		$m['team1']['cc_pos'] = 0;
		$m['team2']['cc_neg'] = 0;
		$m['team2']['cc_pos'] = 0;

		for($i=0;$i<5;$i++){
			$m['team1']['heroes'][$i]['wr'] = $h_wr[$m['team1']['heroes'][$i]['id']];
			$m['team2']['heroes'][$i]['wr'] = $h_wr[$m['team2']['heroes'][$i]['id']];
			if(in_array($m['team2']['heroes'][$i]['id'],$hero_have) || in_array($m['team1']['heroes'][$i]['id'],$hero_have)){
				$hero_have_hh = true;
			}
			$nb1 += floatval($h_wr[$m['team1']['heroes'][$i]['id']]);
			$nb2 += floatval($h_wr[$m['team2']['heroes'][$i]['id']]);

			$m['team1']['heroes'][$i]['name'] = $h[$m['team1']['heroes'][$i]['id']];
			$m['team2']['heroes'][$i]['name'] = $h[$m['team2']['heroes'][$i]['id']];

			$nb1a = 0;
			$nb2a = 0;
			for($a=0;$a<5;$a++){
				$nb1a+=floatval($h_wrs[$m['team2']['heroes'][$a]['id']][$m['team1']['heroes'][$i]['id']][0])*-1;
				$nb2a+=floatval($h_wrs[$m['team1']['heroes'][$a]['id']][$m['team2']['heroes'][$i]['id']][0])*-1;
			}
			$m['team1']['heroes'][$i]['wr_2_success'] = $nb1a > 0 ? false : true;
			$m['team2']['heroes'][$i]['wr_2_success'] = $nb2a > 0 ? false : true;

			$m['team1'][($nb1a > 0 ? 'cc_neg':'cc_pos')]++;
			$m['team2'][($nb2a > 0 ? 'cc_neg':'cc_pos')]++;

			$m['team1']['heroes'][$i]['wr_2'] = number_format($nb1a, 2, '.', "")*-1;
			$m['team2']['heroes'][$i]['wr_2'] = number_format($nb2a, 2, '.', "")*-1;

			$an_t1 = $m['team1']['heroes'][$i]['wr_2'];
			$an_t2 = $m['team2']['heroes'][$i]['wr_2'];
			if(sizeof($anh_have)){
				foreach($anh_have as $an){
					$anh_f = floatval(str_replace('-','',str_replace('+','',$an)));
					$cv1 = floatval(str_replace('-','',str_replace('+','',$an_t1)));
					$cv2 = floatval(str_replace('-','',str_replace('+','',$an_t2)));
					if(strpos($an,'-') === false){
						if(strpos($an_t1,'-') === false){
							if($cv1>$anh_f){
								$hero_have_anh = true;
								break;
							}
						}
						if(strpos($an_t2,'-') === false){
							if($cv2>$anh_f){
								$hero_have_anh = true;
								break;
							}
						}
					}else{
						if(strpos($an_t1,'-') !== false){
							if($cv1>$anh_f){
								$hero_have_anh = true;
								break;
							}
						}
						if(strpos($an_t2,'-') !== false){
							if($cv2>$anh_f){
								$hero_have_anh = true;
								break;
							}
						}
					}
				}
			}

			$nb1 += $nb1a*-1;
			$nb2 += $nb2a*-1;
		}
		$m['team1']['score'] = number_format($nb1, 2, '.', "");
		$m['team2']['score'] = '- '.number_format($nb2, 2, '.', "");
		$m['total'] = number_format(($nb1-$nb2), 2, '.', "");
		$m['total_success'] = ($nb1>$nb2) ? true : false;

		$gh = '<div style="width:600px;max-width:100%;border:1px solid gray;padding:20px;">';
		$gh.= '<h1 style="margin:0px 0px 20px 0px;">'.$m['name'].'</h1>';
		$gh.='<h3>'.$m['team1']['name'].'</h3>';
		$gh.='<div style="display:flex;justify-content: space-between;align-content: space-between;">';
		for($i=0;$i<sizeof($m['team1']['heroes']);$i++){
			$hero_e = $m['team1']['heroes'][$i];
			$gh.='<div style="width:80px;margin-right:20px;">';
			$gh.='<span>'.$hero_e['wr'].' + <span style="'.($hero_e['wr_2_success'] ? 'color:green;':'color:red;').'">'.$hero_e['wr_2'].'</span></span>';
			if(isset($hero_e['image'])){ $gh.='<img style="width:100%;" src="'.$hero_e['image'].'">'; }
			$gh.='<span>'.$hero_e['name'].'</span>';
			$gh.='</div>';
		}
		$gh.='<div><div>'.$m['team1']['score'].'</div></div>';
		$gh.='</div>';
		$gh.='<div style="width:100%;display:block;align-items:center;justify-content:space-between;">';
		$gh.='<h3 style="display:inline-block;">'.$m['team2']['name'].'</h3>';
		$gh.='</div>';
		$gh.='<div style="display:flex;justify-content: space-between;align-content: space-between;">';
		for($i=0;$i<sizeof($m['team2']['heroes']);$i++){
			$hero_e = $m['team2']['heroes'][$i];
			$gh.='<div style="width:80px;margin-right:20px;">';
			$gh.='<span>'.$hero_e['wr'].' + <span style="'.($hero_e['wr_2_success'] ? 'color:green;':'color:red;').'">'.$hero_e['wr_2'].'</span></span>';
			if(isset($hero_e['image'])){ $gh.='<img style="width:100%;" src="'.$hero_e['image'].'">'; }
			$gh.='<span>'.$hero_e['name'].'</span>';
			$gh.='</div>';
		}
		$gh.='<div><div>'.$m['team2']['score'].'</div></div>';
		$gh.='</div>';
		$gh.='<span style="display:block;font-size:30px;margin-top:20px;'.($m['total_success']?'color:green;':'color:red;').'">'.$m['total'].'</span>';
		$gh.='</div>';

		$mets = [];
		$total_f = floatval($m['total']);
		if(($total_f<0&&$total_f<$email_if_less)||$total_f>$email_if_greater){
			$cond_one = true;
			$mets[] = 'Condition 1 is met';
		}
		if((!isset($team_have_plus)||!is_array($team_have_plus)||!sizeof($team_have_plus))){
			$cond_2 = true;
			$mets[] = 'Condition 2 is met';
		}else if(in_array($m['team1']['cc_pos'].'+'.$m['team2']['cc_neg'].'-',$team_have_plus) ||
				in_array($m['team2']['cc_pos'].'+'.$m['team1']['cc_neg'].'-',$team_have_plus) ||
				in_array($m['team1']['cc_pos'].'+'.$m['team2']['cc_pos'].'+',$team_have_plus) ||
				in_array($m['team2']['cc_pos'].'+'.$m['team1']['cc_pos'].'+',$team_have_plus) ||
				in_array($m['team1']['cc_neg'].'-'.$m['team2']['cc_neg'].'-',$team_have_plus) || 
				in_array($m['team2']['cc_neg'].'-'.$m['team1']['cc_neg'].'-',$team_have_plus)){
			$cond_2 = true;
			$mets[] = 'Condition 2 is met';
		}
		if((!isset($hero_have)||!sizeof($hero_have))||$hero_have_hh){
			$cond_3 = true;
			$mets[] = 'Condition 3 is met';
		}
		if((!isset($anh_have)||!sizeof($anh_have))||$hero_have_anh){
			$cond_4 = true;
			$mets[] = 'Condition 4 is met';
		}
		if((!isset($td_g)&&!isset($td_l))||(!$td_g&&!$td_l)){
			$cond_5 = true;
			$mets[] = 'Condition 5 is met';
		}

		echo '<pre>'.json_encode($mets,JSON_PRETTY_PRINT).'</pre>';
		if($debug||($cond_one&&$cond_2&&$cond_3&&$cond_4&&$cond_5)){
			$mail = new PHPMailer(true);
			try {
				$mail->SMTPDebug = 0;
				$mail->isSMTP();
				$mail->Host       = $smtp_host;
				$mail->SMTPAuth   = true;
				$mail->Username   = $smtp_user;
				$mail->Password   = $smtp_pass;
				$mail->SMTPSecure = $smtp_pro;
				$mail->Port       = $smtp_port;
				$mail->setFrom($smtp_from, $smtp_from_name);
				if($debug){
					$mail->addAddress('razorgamefun@gmail.com');
				}else if(isset($dltv_email)){
					$mail->addAddress($dltv_email);
				}
				$mail->SMTPOptions = array(
					'ssl' => array(
						'verify_peer' => false,
						'verify_peer_name' => false,
						'allow_self_signed' => true
					)
				);
				$mail->CharSet = 'UTF-8';
				$mail->isHTML(true);
				$mail->Subject = $m['team1']['name'].' vs '.$m['team2']['name'].' - '.$m['name'];
				$mail->Body    = $gh;
				$mail->AltBody = 'This is the body in plain text for non-HTML mail clients';
				$mail->send();
				echo 'email sent';
			} catch (Exception $e) {
				echo 'email error';
			}
			echo '<br/>';
		}
		$fp = fopen($file, 'w');
		fwrite($fp, json_encode($m)); 
		fclose($fp);
	}
}

