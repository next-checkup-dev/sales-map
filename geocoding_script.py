#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
구글 시트 주소 데이터를 위도, 경도로 변환하는 스크립트
카카오 지도 API를 사용하여 주소를 좌표로 변환합니다.
"""

import requests
import time
import json
from typing import Optional, Tuple
import pandas as pd
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
import os

class KakaoGeocoder:
    def __init__(self, api_key: str):
        """
        카카오 지도 API 초기화
        
        Args:
            api_key (str): 498e5bb317e1d1d671940222856329b0
        """
        self.api_key = api_key
        self.base_url = "https://dapi.kakao.com/v2/local/search/address.json"
        self.headers = {
            "Authorization": f"KakaoAK {api_key}"
        }
    
    def geocode_address(self, address: str) -> Optional[Tuple[float, float]]:
        """
        주소를 위도, 경도로 변환
        
        Args:
            address (str): 변환할 주소
            
        Returns:
            Optional[Tuple[float, float]]: (위도, 경도) 또는 None
        """
        try:
            params = {
                "query": address
            }
            
            response = requests.get(
                self.base_url,
                headers=self.headers,
                params=params,
                timeout=10
            )
            
            if response.status_code == 200:
                data = response.json()
                
                if data["documents"]:
                    # 첫 번째 결과 사용
                    result = data["documents"][0]
                    latitude = float(result["y"])
                    longitude = float(result["x"])
                    return (latitude, longitude)
                else:
                    print(f"주소를 찾을 수 없습니다: {address}")
                    return None
            else:
                print(f"API 요청 실패: {response.status_code}")
                return None
                
        except Exception as e:
            print(f"주소 변환 중 오류 발생: {address}, 오류: {str(e)}")
            return None

class GoogleSheetsUpdater:
    def __init__(self, credentials_file: str):
        """
        구글 시트 업데이터 초기화
        
        Args:
            credentials_file (str): google-service-account-key.json
        """
        self.credentials_file = credentials_file
        self.scope = ['https://www.googleapis.com/auth/spreadsheets']
        self.service = None
        
    def authenticate(self):
        """구글 API 인증"""
        try:
            credentials = Credentials.from_service_account_file(
                self.credentials_file, 
                scopes=self.scope
            )
            self.service = build('sheets', 'v4', credentials=credentials)
            print("구글 API 인증 성공")
        except Exception as e:
            print(f"구글 API 인증 실패: {str(e)}")
            raise
    
    def get_sheet_data(self, spreadsheet_id: str, range_name: str) -> list:
        """
        구글 시트에서 데이터 가져오기
        
        Args:
            spreadsheet_id (str): 12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA
            range_name (str): 범위 (예: '시트1!D:F')
            
        Returns:
            list: 시트 데이터
        """
        if self.service is None:
            raise Exception("구글 API 서비스가 초기화되지 않았습니다. authenticate() 메서드를 먼저 호출하세요.")
            
        try:
            result = self.service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=range_name
            ).execute()
            
            return result.get('values', [])
        except Exception as e:
            print(f"시트 데이터 가져오기 실패: {str(e)}")
            raise
    
    def update_sheet_data(self, spreadsheet_id: str, range_name: str, values: list):
        """
        구글 시트에 데이터 업데이트
        
        Args:
            spreadsheet_id (str): 스프레드시트 ID
            range_name (str): 범위 (예: 'Sheet1!E:F')
            values (list): 업데이트할 데이터
        """
        if self.service is None:
            raise Exception("구글 API 서비스가 초기화되지 않았습니다. authenticate() 메서드를 먼저 호출하세요.")
            
        try:
            body = {
                'values': values
            }
            
            result = self.service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range=range_name,
                valueInputOption='RAW',
                body=body
            ).execute()
            
            print(f"업데이트 완료: {result.get('updatedCells')}개 셀")
        except Exception as e:
            print(f"시트 업데이트 실패: {str(e)}")
            raise

def main():
    # 설정값 - 실제 값으로 수정하세요!
    KAKAO_API_KEY = "498e5bb317e1d1d671940222856329b0"  # 카카오 REST API 키를 입력하세요
    GOOGLE_CREDENTIALS_FILE = "google-service-account-key.json"
    SPREADSHEET_ID = "12pcRCN5bqqupjtVi06O3iW6VG8Q1Xr9qWV51ORUMyIA"  # 구글 시트 ID를 입력하세요 (URL에서 확인)
    SHEET_NAME = "시트1"  # 시트 이름을 입력하세요
    
    # 설정값 검증
    if KAKAO_API_KEY == "YOUR_KAKAO_REST_API_KEY":
        print("오류: 카카오 REST API 키를 설정해주세요!")
        print("geocoding_script.py 파일의 KAKAO_API_KEY 변수를 수정하세요.")
        return
        
    if SPREADSHEET_ID == "YOUR_SPREADSHEET_ID":
        print("오류: 구글 시트 ID를 설정해주세요!")
        print("구글 시트 URL에서 스프레드시트 ID를 복사하여 SPREADSHEET_ID 변수를 수정하세요.")
        print("예: https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit")
        print("     ↑ 이 부분이 스프레드시트 ID입니다")
        return
    
    # 시작 행 (헤더 제외)
    START_ROW = 2
    
    print("주소-좌표 변환 스크립트 시작")
    
    # 카카오 지오코더 초기화
    geocoder = KakaoGeocoder(KAKAO_API_KEY)
    
    # 구글 시트 업데이터 초기화
    sheets_updater = GoogleSheetsUpdater(GOOGLE_CREDENTIALS_FILE)
    sheets_updater.authenticate()
    
    # 기존 데이터 가져오기 (A~D열)
    data_range = f"{SHEET_NAME}!A:D"
    existing_data = sheets_updater.get_sheet_data(SPREADSHEET_ID, data_range)
    
    if not existing_data:
        print("데이터가 없습니다.")
        return
    
    print(f"총 {len(existing_data)}행의 데이터를 처리합니다.")
    
    # 위도, 경도 데이터 수집
    coordinates_data = []
    
    for i, row in enumerate(existing_data, 1):
        if i < START_ROW:
            # 헤더 행은 건너뛰기
            coordinates_data.append(["", ""])
            continue
            
        if len(row) < 4:
            # D열(주소)이 없는 경우
            coordinates_data.append(["", ""])
            continue
            
        address = row[3]  # D열의 주소
        
        if not address or address.strip() == "":
            coordinates_data.append(["", ""])
            continue
            
        print(f"처리 중: {i}행 - {address}")
        
        # 주소를 좌표로 변환
        coordinates = geocoder.geocode_address(address.strip())
        
        if coordinates:
            latitude, longitude = coordinates
            coordinates_data.append([latitude, longitude])
            print(f"  → 위도: {latitude}, 경도: {longitude}")
        else:
            # 변환 실패 시 E열에 '변환실패' 입력
            coordinates_data.append(["변환실패", ""])
            print(f"  → 변환 실패")
        
        # API 호출 제한을 위한 대기
        time.sleep(0.1)
    
    # 모든 데이터 수집 완료 후 E, F열에 한 번에 입력
    print("모든 주소 변환 완료. 구글 시트에 데이터를 입력합니다...")
    coordinates_range = f"{SHEET_NAME}!E:F"
    sheets_updater.update_sheet_data(SPREADSHEET_ID, coordinates_range, coordinates_data)
    
    print("모든 작업이 완료되었습니다!")

if __name__ == "__main__":
    main() 