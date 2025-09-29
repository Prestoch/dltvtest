<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);
$set = [];
$set['pns'] = [];
$set['email'] = [];
$set['hh'] = [];
$set['td_g'] = '';
$set['td_l'] = '';
if(isset($_POST['s'])){
	if(isset($_POST['pns'])){
		$pns = json_decode($_POST['pns'],true);
		if($pns&&sizeof($pns)){
			$set['pns'] = $pns;
		}
	}
	if(isset($_POST['anh_items'])){
		$anh_items = json_decode($_POST['anh_items'],true);
		if($anh_items&&sizeof($anh_items)){
			$set['anh'] = $anh_items;
		}
	}
    // DLTV email only
	if(isset($_POST['scr_token'])){
		$set['scr_token'] = $_POST['scr_token'];
	}
	if(isset($_POST['dltv_email'])){
		$set['dltv_email'] = $_POST['dltv_email'];
	}
    // persist condition toggles and aggregator
    if(isset($_POST['conds'])){
        $conds = json_decode($_POST['conds'],true);
        if(is_array($conds)){
            $set['conds'] = $conds;
        }
    }
    if(isset($_POST['agg'])){
        $set['agg'] = ($_POST['agg'] === 'any') ? 'any' : 'all';
    }
	if(isset($_POST['hrs'])){
		$hh = json_decode($_POST['hrs'],true);
		$i = [];
		foreach($hh as $a){
			$i[] = (int) $a;
		}
		$set['hh'] = $i;
	}
	if(isset($_POST['greater'])){
		$set['greater'] = $_POST['greater'];
	}
	if(isset($_POST['less'])){
		$set['less'] = $_POST['less'];
	}
	if(isset($_POST['td_g'])){
		$set['td_g'] = $_POST['td_g'];
	}
	if(isset($_POST['td_l'])){
		$set['td_l'] = $_POST['td_l'];
	}
	$ps = [];
	if(file_exists('set.json')){
		$pa = json_decode(file_get_contents('set.json'),true);
		if(is_array($pa)&&isset($pa['prox'])){
			$ps = $pa['prox'];
			echo json_encode($ps);
		}
	}
	if(isset($_FILES['prox'])){
		$f = explode(PHP_EOL,file_get_contents($_FILES['prox']['tmp_name']));
		foreach($f as $ff){
			$p = explode(':',trim($ff));
			if(sizeof($p)>2){
				$ps[$p[0]] = [
					'ip'=>$p[0],
					'port'=>$p[1],
					'user'=>$p[2],
					'pass'=>$p[3],
					'status'=>true
				];
			}
		}
	}
	$set['prox'] = $ps;
	file_put_contents('set.json', json_encode($set));
	die();
}
if(file_exists('set.json')){
	$set = json_decode(file_get_contents('set.json'),true);
}
function _e($a){
	echo $a;
}
if(!file_exists(dirname(dirname(__FILE__)).'/cs.json')){
	die('cs.json not found');
}
$csjson = file_get_contents(dirname(dirname(__FILE__)).'/cs.json');
$f1 = explode(', heroes_bg = ',$csjson);
$f2 = explode('var heroes = ',$f1[0]);
if(!isset($f2[1])){
	die('cs.json heroes problem #1');
}
$h = json_decode($f2[1],true);
if(!is_array($h)){
	die('cs.json heroes problem #2');
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
function pre($a){
	echo '<pre>'.json_encode($a,JSON_PRETTY_PRINT).'</pre>';
	//die();
}
function cn($s){
	return preg_replace('/[0-9]+/', '', strtolower(preg_replace("/[^A-Za-z0-9 ]/", '', $s)));
}
foreach($h as $hh){
	$hero[] = cn($hh);
}
function get_hero_id($a){
	global $hero;
	return array_search(cn($a),$hero);
}
$f_bga = $f1[1];
$f_bgb = explode(', heroes_wr =',$f_bga);
$bg = json_decode($f_bgb[0],true);
function bg($i){
	global $bg;
	if(is_int($i)&&isset($bg[$i])){
		return 'https://www.dotabuff.com'.$bg[$i];
	}
	if(!isset($bg[get_hero_id($i)])){
		return 'https://i.pinimg.com/originals/c1/ec/da/c1ecda477bc92b6ecfc533b64d4a0337.png';
	}
	return 'https://www.dotabuff.com'.$bg[get_hero_id($i)];
}
if(isset($_POST['ghd'])&&isset($_POST['h'])){
	$d = [];
	$d['id'] = get_hero_id($_POST['h']);
	$d['bg'] = bg($_POST['h']);
	$d['hero'] = isset($hero[$d['id']]) ? ucfirst($hero[$d['id']]) : '';
	echo json_encode($d);
	die();
}
if(isset($_POST['rem_x_prox'])){
	if(isset($set['prox'])){
		$a = array_filter($set['prox'],function($a){
			return $a['status'];
		});
		$set['prox'] = $a;
		echo json_encode($set);
		file_put_contents('set.json', json_encode($set));
		die();
	}
	echo json_encode($set);
	die();
}

// Handle send test email from settings UI
if(isset($_POST['send_test'])){
    require_once dirname(__DIR__).'/config.php';
    require_once dirname(__DIR__).'/vendor/autoload.php';
    try{
        $mail = new PHPMailer\PHPMailer\PHPMailer(true);
        $mail->isSMTP();
        $mail->Host       = $smtp_host;
        $mail->SMTPAuth   = true;
        $mail->Username   = $smtp_user;
        $mail->Password   = $smtp_pass;
        $mail->SMTPSecure = $smtp_pro;
        $mail->Port       = $smtp_port;
        $mail->setFrom($smtp_from, $smtp_from_name);
        $to = isset($set['dltv_email']) ? $set['dltv_email'] : $smtp_from;
        $mail->addAddress($to);
        $mail->CharSet = 'UTF-8';
        $mail->isHTML(true);
        $mail->Subject = 'DLTV Test Email';
        $mail->Body    = '<b>This is a test email from settings.</b>';
        $mail->AltBody = 'This is a test email from settings.';
        $mail->SMTPOptions = array('ssl'=>array('verify_peer'=>false,'verify_peer_name'=>false,'allow_self_signed'=>true));
        $mail->send();
        echo json_encode(['status'=>'Test email sent to '.$to]);
    }catch(Exception $e){
        echo json_encode(['status'=>'Send failed']);
    }
    die();
}